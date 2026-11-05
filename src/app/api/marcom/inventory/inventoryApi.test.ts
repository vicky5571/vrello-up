import test from "node:test";
import assert from "node:assert/strict";
import { GET as getInventory, POST as postInventory } from "./route";
import { PUT as putItem, DELETE as deleteItem } from "./[id]/route";
import { POST as postBorrow } from "./borrow/route";
import { PUT as putBorrow } from "./borrow/[id]/route";
import { POST as returnBorrow } from "./borrow/[id]/return/route";
import { POST as settleBorrow } from "./borrow/[id]/settle/route";
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
    headers: {
      "Content-Type": "application/json",
      "x-user-role": "warehouse",
    },
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

test("API: Return Inspection Breakdown, Compensation Workflow, and Four-Eyes Principle (ADR-0050)", async () => {
  // 1. Create a test item with 10 total units
  const testCode = `INSPECT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const itemRes = await postInventory(
    new Request("http://localhost:3000/api/marcom/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Inspection Test Speakers",
        code: testCode,
        category: "Audio",
        totalUnits: 10,
        storageLocation: "Warehouse A",
      }),
    })
  );
  assert.equal(itemRes.status, 201);
  const testItem = await itemRes.json();
  assert.equal(testItem.availableUnits, 10);
  assert.equal(testItem.totalUnits, 10);

  // 2. Create and activate a borrow of 10 units
  const borrowRes = await postBorrow(
    new Request("http://localhost:3000/api/marcom/inventory/borrow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        borrowerName: "Field Staff Tester",
        borrowerPhone: "0812345678",
        borrowDate: new Date().toISOString().slice(0, 10),
        returnDueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        items: [{ inventoryItemId: testItem.id, quantity: 10 }],
      }),
    })
  );
  assert.equal(borrowRes.status, 201);
  const borrowRecord = await borrowRes.json();

  // Approve and activate
  await putBorrow(
    new Request(`http://localhost:3000/api/marcom/inventory/borrow/${borrowRecord.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "APPROVED" }),
    }),
    { params: Promise.resolve({ id: borrowRecord.id }) }
  );

  const activateRes = await putBorrow(
    new Request(`http://localhost:3000/api/marcom/inventory/borrow/${borrowRecord.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ACTIVE" }),
    }),
    { params: Promise.resolve({ id: borrowRecord.id }) }
  );
  const activeRecord = await activateRes.json();
  const borrowItemId = activeRecord.items[0].id;

  // Verify availableUnits decremented to 0
  const itemActive = await prisma.inventoryItem.findUnique({ where: { id: testItem.id } });
  assert.equal(itemActive?.availableUnits, 0);

  // 3. Test Four-Eyes Principle: Staff is rejected with 403
  const staffReturnRes = await returnBorrow(
    new Request(`http://localhost:3000/api/marcom/inventory/borrow/${borrowRecord.id}/return`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "staff",
      },
      body: JSON.stringify({
        items: [{ borrowItemId, goodUnits: 10, minorDamageUnits: 0, majorDamageUnits: 0, lostUnits: 0 }],
      }),
    }),
    { params: Promise.resolve({ id: borrowRecord.id }) }
  );
  assert.equal(staffReturnRes.status, 403);
  const staffBody = await staffReturnRes.json();
  assert.ok(staffBody.error.includes("Warehouse"));

  // 4. Test Sum Validation: mismatched units rejected with 422
  const invalidSumRes = await returnBorrow(
    new Request(`http://localhost:3000/api/marcom/inventory/borrow/${borrowRecord.id}/return`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "warehouse",
      },
      body: JSON.stringify({
        items: [{ borrowItemId, goodUnits: 7, minorDamageUnits: 1, majorDamageUnits: 0, lostUnits: 0 }], // sum = 8 != 10
      }),
    }),
    { params: Promise.resolve({ id: borrowRecord.id }) }
  );
  assert.equal(invalidSumRes.status, 422);

  // 5. Valid return by Warehouse role:
  // 8 good, 1 major damage, 1 lost
  const validReturnRes = await returnBorrow(
    new Request(`http://localhost:3000/api/marcom/inventory/borrow/${borrowRecord.id}/return`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "warehouse",
      },
      body: JSON.stringify({
        returnNotes: "Inspection completed with damage and loss",
        compensationAmount: 750000,
        compensationNotes: "Replacement fee for 1 lost unit and repair quote for 1 damaged unit",
        damagePhotos: ["https://example.com/damage1.jpg"],
        items: [
          {
            borrowItemId,
            goodUnits: 8,
            minorDamageUnits: 0,
            majorDamageUnits: 1,
            lostUnits: 1,
            notes: "1 dropped, 1 missing cable/unit",
          },
        ],
      }),
    }),
    { params: Promise.resolve({ id: borrowRecord.id }) }
  );
  assert.equal(validReturnRes.status, 200);
  const returnedRecord = await validReturnRes.json();
  assert.equal(returnedRecord.status, "RETURNED");
  assert.equal(returnedRecord.compensationStatus, "PENDING_SETTLEMENT");
  assert.equal(returnedRecord.compensationAmount, 750000);
  assert.equal(returnedRecord.compensationNotes, "Replacement fee for 1 lost unit and repair quote for 1 damaged unit");
  assert.deepEqual(returnedRecord.damagePhotos, ["https://example.com/damage1.jpg"]);

  // 6. Verify inventory balance arithmetic:
  // availableUnits should be 8 (from 0 + 8)
  // totalUnits should be 8 (from 10 - 2 write-offs: 1 major + 1 lost)
  const itemFinal = await prisma.inventoryItem.findUnique({ where: { id: testItem.id } });
  assert.equal(itemFinal?.availableUnits, 8);
  assert.equal(itemFinal?.totalUnits, 8);
  assert.equal(itemFinal?.status, "AVAILABLE");

  // 7. Clean up test records
  await prisma.borrowItem.deleteMany({ where: { borrowRecordId: borrowRecord.id } });
  await prisma.borrowRecord.delete({ where: { id: borrowRecord.id } });
  await prisma.inventoryItem.delete({ where: { id: testItem.id } });
});

test("API: Compensation Settlement Lifecycle, Dual-Mode Stock Restoration, and Four-Eyes RBAC (ADR-0052)", async () => {
  // 1. Create a test item with 6 units
  const testCode = `SETTLE-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const itemRes = await postInventory(
    new Request("http://localhost:3000/api/marcom/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Settle Audio",
        code: testCode,
        category: "Audio",
        totalUnits: 6,
        storageLocation: "Test Warehouse",
      }),
    })
  );
  assert.equal(itemRes.status, 201);
  const testItem = await itemRes.json();

  // 2. Create borrow request for 4 units, approve, and activate
  const borrowRes = await postBorrow(
    new Request("http://localhost:3000/api/marcom/inventory/borrow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        borrowerName: "Settlement Test User",
        borrowDate: new Date().toISOString().slice(0, 10),
        returnDueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        items: [{ inventoryItemId: testItem.id, quantity: 4 }],
      }),
    })
  );
  assert.equal(borrowRes.status, 201);
  const borrow = await borrowRes.json();

  await putBorrow(
    new Request(`http://localhost:3000/api/marcom/inventory/borrow/${borrow.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "APPROVED" }),
    }),
    { params: Promise.resolve({ id: borrow.id }) }
  );

  const activateRes = await putBorrow(
    new Request(`http://localhost:3000/api/marcom/inventory/borrow/${borrow.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ACTIVE" }),
    }),
    { params: Promise.resolve({ id: borrow.id }) }
  );
  const activeRecord = await activateRes.json();
  const borrowItemId = activeRecord.items[0].id;

  // 3. Process return with 2 good, 1 major damage, 1 lost (total afkir: 2)
  const returnRes = await returnBorrow(
    new Request(`http://localhost:3000/api/marcom/inventory/borrow/${borrow.id}/return`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "warehouse",
      },
      body: JSON.stringify({
        returnNotes: "Return with 1 major damage and 1 lost",
        compensationAmount: 500000,
        compensationNotes: "Repair and replacement cost",
        items: [
          {
            borrowItemId,
            goodUnits: 2,
            minorDamageUnits: 0,
            majorDamageUnits: 1,
            lostUnits: 1,
          },
        ],
      }),
    }),
    { params: Promise.resolve({ id: borrow.id }) }
  );
  assert.equal(returnRes.status, 200);
  const returnedRecord = await returnRes.json();
  assert.equal(returnedRecord.compensationStatus, "PENDING_SETTLEMENT");

  // Stock after return: totalUnits = 6 - 2 = 4, availableUnits = (6-4) + 2 = 4
  const itemAfterReturn = await prisma.inventoryItem.findUnique({ where: { id: testItem.id } });
  assert.equal(itemAfterReturn?.totalUnits, 4);
  assert.equal(itemAfterReturn?.availableUnits, 4);

  // 4. Test RBAC: Unauthenticated rejected with 401
  const unauthRes = await settleBorrow(
    new Request(`http://localhost:3000/api/marcom/inventory/borrow/${borrow.id}/settle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settlementType: "CASH_TRANSFER" }),
    }),
    { params: Promise.resolve({ id: borrow.id }) }
  );
  assert.equal(unauthRes.status, 401);

  // 5. Test RBAC: Staff rejected with 403 (Four-Eyes Principle)
  const staffRes = await settleBorrow(
    new Request(`http://localhost:3000/api/marcom/inventory/borrow/${borrow.id}/settle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "staff",
      },
      body: JSON.stringify({
        settlementType: "CASH_TRANSFER",
        settledAmount: 500000,
        settlementNotes: "Staff trying to self-settle",
        settlementProofUrls: ["https://example.com/receipt.pdf"],
      }),
    }),
    { params: Promise.resolve({ id: borrow.id }) }
  );
  assert.equal(staffRes.status, 403);

  // 6. Test Validation: Missing notes returns 400
  const noNotesRes = await settleBorrow(
    new Request(`http://localhost:3000/api/marcom/inventory/borrow/${borrow.id}/settle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "warehouse",
      },
      body: JSON.stringify({
        settlementType: "CASH_TRANSFER",
        settlementNotes: "   ",
        settlementProofUrls: ["https://example.com/receipt.pdf"],
      }),
    }),
    { params: Promise.resolve({ id: borrow.id }) }
  );
  assert.equal(noNotesRes.status, 400);

  // 7. Test Validation: Empty proof URLs returns 422
  const noProofRes = await settleBorrow(
    new Request(`http://localhost:3000/api/marcom/inventory/borrow/${borrow.id}/settle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "warehouse",
      },
      body: JSON.stringify({
        settlementType: "CASH_TRANSFER",
        settlementNotes: "Paid in cash",
        settlementProofUrls: [],
      }),
    }),
    { params: Promise.resolve({ id: borrow.id }) }
  );
  assert.equal(noProofRes.status, 422);

  // 8. Test Mode A: CASH_TRANSFER
  const cashSettleRes = await settleBorrow(
    new Request(`http://localhost:3000/api/marcom/inventory/borrow/${borrow.id}/settle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "warehouse",
      },
      body: JSON.stringify({
        settlementType: "CASH_TRANSFER",
        settledAmount: 500000,
        settlementNotes: "Transfer via BCA a.n. Budi",
        settlementProofUrls: ["https://example.com/bca-transfer.pdf"],
      }),
    }),
    { params: Promise.resolve({ id: borrow.id }) }
  );
  assert.equal(cashSettleRes.status, 200);
  const cashSettledRecord = await cashSettleRes.json();
  assert.equal(cashSettledRecord.compensationStatus, "RESOLVED");
  assert.equal(cashSettledRecord.settlementType, "CASH_TRANSFER");
  assert.equal(cashSettledRecord.settledAmount, 500000);
  assert.deepEqual(cashSettledRecord.settlementProofUrls, ["https://example.com/bca-transfer.pdf"]);

  // In CASH_TRANSFER mode, stock remains afkir (totalUnits and availableUnits remain 4)
  const itemAfterCash = await prisma.inventoryItem.findUnique({ where: { id: testItem.id } });
  assert.equal(itemAfterCash?.totalUnits, 4);
  assert.equal(itemAfterCash?.availableUnits, 4);

  // 9. Test Rejection: Settle already resolved record returns 400
  const reSettleRes = await settleBorrow(
    new Request(`http://localhost:3000/api/marcom/inventory/borrow/${borrow.id}/settle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "warehouse",
      },
      body: JSON.stringify({
        settlementType: "CASH_TRANSFER",
        settlementNotes: "Trying again",
        settlementProofUrls: ["https://example.com/receipt2.pdf"],
      }),
    }),
    { params: Promise.resolve({ id: borrow.id }) }
  );
  assert.equal(reSettleRes.status, 400);

  // 10. Test Mode B: ITEM_REPLACEMENT with stock restoration
  // Reset borrow record to PENDING_SETTLEMENT to test ITEM_REPLACEMENT restoration
  await prisma.borrowRecord.update({
    where: { id: borrow.id },
    data: {
      compensationStatus: "PENDING_SETTLEMENT",
      settlementType: "NONE",
      settledAmount: 0,
      settledAt: null,
      settlementProofUrls: [],
    },
  });

  const replaceSettleRes = await settleBorrow(
    new Request(`http://localhost:3000/api/marcom/inventory/borrow/${borrow.id}/settle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "warehouse",
      },
      body: JSON.stringify({
        settlementType: "ITEM_REPLACEMENT",
        settlementNotes: "Replacement unit physically handed to warehouse",
        settlementProofUrls: ["https://example.com/handover-photo.jpg"],
      }),
    }),
    { params: Promise.resolve({ id: borrow.id }) }
  );
  assert.equal(replaceSettleRes.status, 200);
  const replaceRecord = await replaceSettleRes.json();
  assert.equal(replaceRecord.compensationStatus, "RESOLVED");
  assert.equal(replaceRecord.settlementType, "ITEM_REPLACEMENT");
  assert.equal(replaceRecord.settledAmount, 0); // 0 in ITEM_REPLACEMENT

  // In ITEM_REPLACEMENT mode, the 2 afkir units are restored to totalUnits and availableUnits:
  // 4 + 2 = 6!
  const itemAfterReplace = await prisma.inventoryItem.findUnique({ where: { id: testItem.id } });
  assert.equal(itemAfterReplace?.totalUnits, 6);
  assert.equal(itemAfterReplace?.availableUnits, 6);

  // 11. Cleanup test records
  await prisma.borrowItem.deleteMany({ where: { borrowRecordId: borrow.id } });
  await prisma.borrowRecord.delete({ where: { id: borrow.id } });
  await prisma.inventoryItem.delete({ where: { id: testItem.id } });
});
