import test from "node:test";
import assert from "node:assert/strict";
import { GET as getInventory, POST as postInventory } from "./route";
import { PUT as putItem, DELETE as deleteItem } from "./[id]/route";
import { POST as postBorrow } from "./borrow/route";
import { PUT as putBorrow } from "./borrow/[id]/route";
import { POST as returnBorrow } from "./borrow/[id]/return/route";
import { prisma } from "@/lib/db";

test("API: GET /api/marcom/inventory returns catalog items", async () => {
  const req = new Request("http://localhost:3000/api/marcom/inventory");
  const res = await getInventory(req);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.total >= 13);
  assert.ok(Array.isArray(data.data));
});

test("API: POST /api/marcom/inventory validates input and enforces unique code", async () => {
  // Missing required fields
  const invalidReq = new Request("http://localhost:3000/api/marcom/inventory", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Incomplete" }),
  });
  const invalidRes = await postInventory(invalidReq);
  assert.equal(invalidRes.status, 400);

  // Duplicate code (AC-5)
  const dupReq = new Request("http://localhost:3000/api/marcom/inventory", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Duplicate Tent",
      code: "TND-001",
      category: "Branding",
      totalUnits: 2,
    }),
  });
  const dupRes = await postInventory(dupReq);
  assert.equal(dupRes.status, 409);
});

test("API: Full Borrow & Return Lifecycle", async () => {
  // 1. Create a test item
  const testCode = `TEST-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const createItemReq = new Request("http://localhost:3000/api/marcom/inventory", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test Sound System",
      code: testCode,
      category: "Audio",
      totalUnits: 5,
      storageLocation: "Test Warehouse",
    }),
  });
  const createItemRes = await postInventory(createItemReq);
  assert.equal(createItemRes.status, 201);
  const testItem = await createItemRes.json();
  assert.equal(testItem.availableUnits, 5);

  // 2. Test AC-15: Decreasing totalUnits below availableUnits returns 422
  const putItemReq = new Request(`http://localhost:3000/api/marcom/inventory/${testItem.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ totalUnits: 3 }), // 3 < 5
  });
  const putItemRes = await putItem(putItemReq, { params: Promise.resolve({ id: testItem.id }) });
  assert.equal(putItemRes.status, 422);

  // 3. Create Borrow Request (AC-6: initial status PENDING, availableUnits unchanged)
  const borrowReq = new Request("http://localhost:3000/api/marcom/inventory/borrow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      borrowerName: "Budi Test",
      borrowerPhone: "0811111111",
      borrowerDivision: "Field Ops",
      eventLocation: "City Mall",
      borrowDate: new Date().toISOString().slice(0, 10),
      returnDueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      purpose: "Weekend Test Roadshow",
      items: [{ inventoryItemId: testItem.id, quantity: 2 }],
    }),
  });
  const borrowRes = await postBorrow(borrowReq);
  assert.equal(borrowRes.status, 201);
  const borrowRecord = await borrowRes.json();
  assert.equal(borrowRecord.status, "PENDING");
  assert.ok(borrowRecord.borrowCode.startsWith("BRW-"));

  // Check item availability still 5
  const itemAfterBorrow = await prisma.inventoryItem.findUnique({ where: { id: testItem.id } });
  assert.equal(itemAfterBorrow?.availableUnits, 5);

  // 4. Approve request: PENDING -> APPROVED
  const approveReq = new Request(`http://localhost:3000/api/marcom/inventory/borrow/${borrowRecord.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "APPROVED", approvedBy: "Admin Test" }),
  });
  const approveRes = await putBorrow(approveReq, { params: Promise.resolve({ id: borrowRecord.id }) });
  assert.equal(approveRes.status, 200);
  const approvedRecord = await approveRes.json();
  assert.equal(approvedRecord.status, "APPROVED");

  // 5. Activate borrow: APPROVED -> ACTIVE (AC-7: decrements availableUnits)
  const activateReq = new Request(`http://localhost:3000/api/marcom/inventory/borrow/${borrowRecord.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "ACTIVE" }),
  });
  const activateRes = await putBorrow(activateReq, { params: Promise.resolve({ id: borrowRecord.id }) });
  assert.equal(activateRes.status, 200);
  const activeRecord = await activateRes.json();
  assert.equal(activeRecord.status, "ACTIVE");

  // Verify availability decremented to 3
  const itemAfterActive = await prisma.inventoryItem.findUnique({ where: { id: testItem.id } });
  assert.equal(itemAfterActive?.availableUnits, 3);

  // 6. Test AC-14: Cannot delete item while it has ACTIVE borrow
  const deleteReq = new Request(`http://localhost:3000/api/marcom/inventory/${testItem.id}`, {
    method: "DELETE",
  });
  const deleteRes = await deleteItem(deleteReq, { params: Promise.resolve({ id: testItem.id }) });
  assert.equal(deleteRes.status, 409);

  // 7. Process return: POST /return (AC-8: status RETURNED, restores availableUnits)
  const returnReq = new Request(`http://localhost:3000/api/marcom/inventory/borrow/${borrowRecord.id}/return`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      returnNotes: "All returned in good condition",
      items: [
        {
          borrowItemId: activeRecord.items[0].id,
          conditionIn: "GOOD",
          notes: "Inspected OK",
        },
      ],
    }),
  });
  const returnRes = await returnBorrow(returnReq, { params: Promise.resolve({ id: borrowRecord.id }) });
  assert.equal(returnRes.status, 200);
  const returnedRecord = await returnRes.json();
  assert.equal(returnedRecord.status, "RETURNED");

  // Verify availableUnits restored to 5
  const itemAfterReturn = await prisma.inventoryItem.findUnique({ where: { id: testItem.id } });
  assert.equal(itemAfterReturn?.availableUnits, 5);

  // 8. Clean up test records
  await prisma.borrowItem.deleteMany({ where: { borrowRecordId: borrowRecord.id } });
  await prisma.borrowRecord.delete({ where: { id: borrowRecord.id } });
  await prisma.inventoryItem.delete({ where: { id: testItem.id } });
});
