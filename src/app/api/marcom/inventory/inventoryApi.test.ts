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
    headers: {
      "Content-Type": "application/json",
      "x-user-role": "staff",
      "x-user-name": "Budi Test",
    },
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
    headers: {
      "Content-Type": "application/json",
      "x-user-role": "supervisor",
      "x-user-name": "Supervisor Approver",
    },
    body: JSON.stringify({ status: "APPROVED", approvedBy: "Admin Test" }),
  });
  const approveRes = await putBorrow(approveReq, { params: Promise.resolve({ id: borrowRecord.id }) });
  assert.equal(approveRes.status, 200);
  const approvedRecord = await approveRes.json();
  assert.equal(approvedRecord.status, "APPROVED");

  // 5. Activate borrow: APPROVED -> ACTIVE (AC-7: decrements availableUnits)
  const activateReq = new Request(`http://localhost:3000/api/marcom/inventory/borrow/${borrowRecord.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-user-role": "warehouse",
      "x-user-name": "Warehouse Officer",
    },
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
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "staff",
        "x-user-name": "Field Staff Tester",
      },
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
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "supervisor",
        "x-user-name": "Supervisor Approver",
      },
      body: JSON.stringify({ status: "APPROVED" }),
    }),
    { params: Promise.resolve({ id: borrowRecord.id }) }
  );

  const activateRes = await putBorrow(
    new Request(`http://localhost:3000/api/marcom/inventory/borrow/${borrowRecord.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "warehouse",
        "x-user-name": "Warehouse Officer",
      },
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
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "staff",
        "x-user-name": "Settlement Test User",
      },
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

  const approveRes = await putBorrow(
    new Request(`http://localhost:3000/api/marcom/inventory/borrow/${borrow.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "supervisor",
        "x-user-name": "Supervisor Approver",
      },
      body: JSON.stringify({ status: "APPROVED" }),
    }),
    { params: Promise.resolve({ id: borrow.id }) }
  );
  assert.equal(approveRes.status, 200);

  const activateRes = await putBorrow(
    new Request(`http://localhost:3000/api/marcom/inventory/borrow/${borrow.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "warehouse",
        "x-user-name": "Warehouse Officer",
      },
      body: JSON.stringify({ status: "ACTIVE" }),
    }),
    { params: Promise.resolve({ id: borrow.id }) }
  );
  assert.equal(activateRes.status, 200);
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

test("API: Inventory Borrow Server-Side RBAC Guard & Audit Integrity (ADR-0100)", async () => {
  // 1. Create a test item with 5 units
  const testCode = `RBAC-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const itemRes = await postInventory(
    new Request("http://localhost:3000/api/marcom/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "RBAC Test Sound System",
        code: testCode,
        category: "Audio",
        totalUnits: 5,
        storageLocation: "Security Warehouse",
      }),
    })
  );
  assert.equal(itemRes.status, 201);
  const testItem = await itemRes.json();

  // Test Case A: Unauthenticated rejection (401) on POST /borrow
  const unauthBorrowRes = await postBorrow(
    new Request("http://localhost:3000/api/marcom/inventory/borrow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        borrowerName: "Unauthenticated Caller",
        borrowDate: new Date().toISOString().slice(0, 10),
        returnDueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        items: [{ inventoryItemId: testItem.id, quantity: 1 }],
      }),
    })
  );
  assert.equal(unauthBorrowRes.status, 401);

  // Test Case B: Viewer rejection (403) on POST /borrow (AC-1)
  const viewerBorrowRes = await postBorrow(
    new Request("http://localhost:3000/api/marcom/inventory/borrow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "viewer",
        "x-user-name": "Viewer User",
      },
      body: JSON.stringify({
        borrowerName: "Viewer User",
        borrowDate: new Date().toISOString().slice(0, 10),
        returnDueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        items: [{ inventoryItemId: testItem.id, quantity: 1 }],
      }),
    })
  );
  assert.equal(viewerBorrowRes.status, 403);
  const viewerBorrowBody = await viewerBorrowRes.json();
  assert.ok(viewerBorrowBody.error.includes("tidak memiliki izin"));

  // 2. Staff creates a valid borrow request for Alice Smith (status: PENDING)
  const aliceBorrowRes = await postBorrow(
    new Request("http://localhost:3000/api/marcom/inventory/borrow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "staff",
        "x-user-name": "Alice Smith",
      },
      body: JSON.stringify({
        borrowerName: "Alice Smith",
        borrowerPhone: "0812999999",
        borrowerDivision: "Field Sales",
        eventLocation: "Expo Center",
        borrowDate: new Date().toISOString().slice(0, 10),
        returnDueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        purpose: "Demo Product Launch",
        items: [{ inventoryItemId: testItem.id, quantity: 2 }],
      }),
    })
  );
  assert.equal(aliceBorrowRes.status, 201);
  const aliceRecord = await aliceBorrowRes.json();
  assert.equal(aliceRecord.status, "PENDING");

  // Test Case C: Unauthenticated rejection (401) on PUT /borrow/[id]
  const unauthPutRes = await putBorrow(
    new Request(`http://localhost:3000/api/marcom/inventory/borrow/${aliceRecord.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "APPROVED" }),
    }),
    { params: Promise.resolve({ id: aliceRecord.id }) }
  );
  assert.equal(unauthPutRes.status, 401);

  // Test Case D: Staff / Viewer rejection (403) on direct approval (AC-2)
  const staffApproveRes = await putBorrow(
    new Request(`http://localhost:3000/api/marcom/inventory/borrow/${aliceRecord.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "staff",
        "x-user-name": "Alice Smith",
      },
      body: JSON.stringify({ status: "APPROVED" }),
    }),
    { params: Promise.resolve({ id: aliceRecord.id }) }
  );
  assert.equal(staffApproveRes.status, 403);
  const staffApproveBody = await staffApproveRes.json();
  assert.ok(staffApproveBody.error.includes("Supervisor"));

  // Verify record status is still PENDING
  const recordStillPending = await prisma.borrowRecord.findUnique({ where: { id: aliceRecord.id } });
  assert.equal(recordStillPending?.status, "PENDING");

  // Test Case E: Staff self-cancellation on PENDING request allowed (AC-4)
  const aliceCancelRes = await putBorrow(
    new Request(`http://localhost:3000/api/marcom/inventory/borrow/${aliceRecord.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "staff",
        "x-user-name": "Alice Smith",
      },
      body: JSON.stringify({ status: "CANCELLED" }),
    }),
    { params: Promise.resolve({ id: aliceRecord.id }) }
  );
  assert.equal(aliceCancelRes.status, 200);
  const cancelledRecord = await aliceCancelRes.json();
  assert.equal(cancelledRecord.status, "CANCELLED");

  // 3. Create a second borrow request for Alice Smith to test unmatching staff cancellation & approval flow
  const secondBorrowRes = await postBorrow(
    new Request("http://localhost:3000/api/marcom/inventory/borrow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "staff",
        "x-user-name": "Alice Smith",
      },
      body: JSON.stringify({
        borrowerName: "Alice Smith",
        borrowDate: new Date().toISOString().slice(0, 10),
        returnDueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        items: [{ inventoryItemId: testItem.id, quantity: 2 }],
      }),
    })
  );
  assert.equal(secondBorrowRes.status, 201);
  const secondRecord = await secondBorrowRes.json();

  // Test Case F: Staff Bob cannot cancel Alice's request (AC-5)
  const bobCancelRes = await putBorrow(
    new Request(`http://localhost:3000/api/marcom/inventory/borrow/${secondRecord.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "staff",
        "x-user-name": "Bob Jones",
      },
      body: JSON.stringify({ status: "CANCELLED" }),
    }),
    { params: Promise.resolve({ id: secondRecord.id }) }
  );
  assert.equal(bobCancelRes.status, 403);

  // Test Case G: Server-derived approvedBy enforcement & spoof body discarded (AC-3)
  const approveRes = await putBorrow(
    new Request(`http://localhost:3000/api/marcom/inventory/borrow/${secondRecord.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "supervisor",
        "x-user-name": "John Doe",
      },
      body: JSON.stringify({
        status: "APPROVED",
        approvedBy: "Fake Admin Spoof",
      }),
    }),
    { params: Promise.resolve({ id: secondRecord.id }) }
  );
  assert.equal(approveRes.status, 200);
  const approvedData = await approveRes.json();
  assert.equal(approvedData.status, "APPROVED");
  assert.equal(approvedData.approvedBy, "John Doe");
  assert.ok(approvedData.approvedAt);

  // Check DB directly
  const dbApproved = await prisma.borrowRecord.findUnique({ where: { id: secondRecord.id } });
  assert.equal(dbApproved?.approvedBy, "John Doe");
  assert.ok(dbApproved?.approvedAt);

  // Test Case H: Staff rejection on direct pickup / ACTIVE (AC-6)
  const staffPickupRes = await putBorrow(
    new Request(`http://localhost:3000/api/marcom/inventory/borrow/${secondRecord.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "staff",
        "x-user-name": "Alice Smith",
      },
      body: JSON.stringify({ status: "ACTIVE" }),
    }),
    { params: Promise.resolve({ id: secondRecord.id }) }
  );
  assert.equal(staffPickupRes.status, 403);

  // Item availability still 5 (NOT decremented)
  const itemBeforeManagerPickup = await prisma.inventoryItem.findUnique({ where: { id: testItem.id } });
  assert.equal(itemBeforeManagerPickup?.availableUnits, 5);

  // Test Case I: Staff cannot cancel an APPROVED request (only managers can)
  const staffCancelApprovedRes = await putBorrow(
    new Request(`http://localhost:3000/api/marcom/inventory/borrow/${secondRecord.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "staff",
        "x-user-name": "Alice Smith",
      },
      body: JSON.stringify({ status: "CANCELLED" }),
    }),
    { params: Promise.resolve({ id: secondRecord.id }) }
  );
  assert.equal(staffCancelApprovedRes.status, 403);

  // Test Case J: Manager (Warehouse) can cancel an APPROVED request
  const managerCancelRes = await putBorrow(
    new Request(`http://localhost:3000/api/marcom/inventory/borrow/${secondRecord.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "warehouse",
        "x-user-name": "Warehouse Lead",
      },
      body: JSON.stringify({ status: "CANCELLED" }),
    }),
    { params: Promise.resolve({ id: secondRecord.id }) }
  );
  assert.equal(managerCancelRes.status, 200);
  const managerCancelledData = await managerCancelRes.json();
  assert.equal(managerCancelledData.status, "CANCELLED");

  // 4. Cleanup test records
  await prisma.borrowItem.deleteMany({
    where: { borrowRecordId: { in: [aliceRecord.id, secondRecord.id] } },
  });
  await prisma.borrowRecord.deleteMany({
    where: { id: { in: [aliceRecord.id, secondRecord.id] } },
  });
  await prisma.inventoryItem.delete({ where: { id: testItem.id } });
});

test("API: Calendar-Based Equipment Booking and Collision Engine (ADR-0102)", async () => {
  // 1. Create a 1-unit test item
  const itemCode = `COLLISION-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const itemRes = await postInventory(
    new Request("http://localhost:3000/api/marcom/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Solo Projector 4K",
        code: itemCode,
        category: "Visual",
        totalUnits: 1,
        storageLocation: "Shelf C-1",
      }),
    })
  );
  assert.equal(itemRes.status, 201);
  const singleItem = await itemRes.json();
  assert.equal(singleItem.totalUnits, 1);

  // AC-1: Booking-1 for Nov 10-12
  const b1Res = await postBorrow(
    new Request("http://localhost:3000/api/marcom/inventory/borrow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "staff",
        "x-user-name": "Staff User",
      },
      body: JSON.stringify({
        borrowerName: "Staff User",
        borrowDate: "2026-11-10",
        returnDueDate: "2026-11-12",
        purpose: "Event A",
        items: [{ inventoryItemId: singleItem.id, quantity: 1 }],
      }),
    })
  );
  assert.equal(b1Res.status, 201);
  const b1 = await b1Res.json();

  // Approve Booking-1
  const appB1 = await putBorrow(
    new Request(`http://localhost:3000/api/marcom/inventory/borrow/${b1.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "supervisor",
        "x-user-name": "Supervisor Lead",
      },
      body: JSON.stringify({ status: "APPROVED" }),
    }),
    { params: Promise.resolve({ id: b1.id }) }
  );
  assert.equal(appB1.status, 200);

  // AC-1: Booking-2 for Nov 15-18 (Non-overlapping, should succeed)
  const b2Res = await postBorrow(
    new Request("http://localhost:3000/api/marcom/inventory/borrow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "staff",
        "x-user-name": "Staff User",
      },
      body: JSON.stringify({
        borrowerName: "Staff User",
        borrowDate: "2026-11-15",
        returnDueDate: "2026-11-18",
        purpose: "Event B",
        items: [{ inventoryItemId: singleItem.id, quantity: 1 }],
      }),
    })
  );
  assert.equal(b2Res.status, 201);
  const b2 = await b2Res.json();

  const appB2 = await putBorrow(
    new Request(`http://localhost:3000/api/marcom/inventory/borrow/${b2.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "supervisor",
        "x-user-name": "Supervisor Lead",
      },
      body: JSON.stringify({ status: "APPROVED" }),
    }),
    { params: Promise.resolve({ id: b2.id }) }
  );
  assert.equal(appB2.status, 200);

  // AC-2: Hard Overlap Collision Rejection at Creation
  // Attempt to book Nov 11-14 (overlaps Booking-1 on Nov 11 and 12)
  const b3Res = await postBorrow(
    new Request("http://localhost:3000/api/marcom/inventory/borrow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "staff",
        "x-user-name": "Another Staff",
      },
      body: JSON.stringify({
        borrowerName: "Another Staff",
        borrowDate: "2026-11-11",
        returnDueDate: "2026-11-14",
        purpose: "Event C",
        items: [{ inventoryItemId: singleItem.id, quantity: 1 }],
      }),
    })
  );
  assert.equal(b3Res.status, 422);
  const b3Err = await b3Res.json();
  assert.ok(b3Err.error.includes("bentrok"));
  assert.ok(Array.isArray(b3Err.conflicts));
  assert.equal(b3Err.conflicts[0].itemName, "Solo Projector 4K");
  assert.ok(b3Err.conflicts[0].conflictingDates.includes("2026-11-11"));

  // AC-6: Schedule Extension Collision Block
  // Booking-1 (Nov 10-12) tries to extend to Nov 16, which collides with Booking-2 (Nov 15-18)
  const extRes = await putBorrow(
    new Request(`http://localhost:3000/api/marcom/inventory/borrow/${b1.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "warehouse",
        "x-user-name": "Warehouse Manager",
      },
      body: JSON.stringify({ returnDueDate: "2026-11-16" }),
    }),
    { params: Promise.resolve({ id: b1.id }) }
  );
  assert.equal(extRes.status, 422);
  const extErr = await extRes.json();
  assert.ok(extErr.error.includes("Tidak dapat memperpanjang jadwal"));

  // AC-3: Double-Approval Race Condition Prevention
  // Create two pending records for the same future date Nov 25-27 directly
  const p1 = await prisma.borrowRecord.create({
    data: {
      borrowCode: `BRW-P1-${Date.now()}`,
      borrowerName: "Requester 1",
      borrowDate: new Date("2026-11-25T00:00:00Z"),
      returnDueDate: new Date("2026-11-27T00:00:00Z"),
      status: "PENDING",
      items: { create: [{ inventoryItemId: singleItem.id, quantity: 1, conditionOut: "GOOD" }] },
    },
  });
  const p2 = await prisma.borrowRecord.create({
    data: {
      borrowCode: `BRW-P2-${Date.now()}`,
      borrowerName: "Requester 2",
      borrowDate: new Date("2026-11-25T00:00:00Z"),
      returnDueDate: new Date("2026-11-27T00:00:00Z"),
      status: "PENDING",
      items: { create: [{ inventoryItemId: singleItem.id, quantity: 1, conditionOut: "GOOD" }] },
    },
  });

  // Approver 1 approves p1 -> 200 OK
  const appP1 = await putBorrow(
    new Request(`http://localhost:3000/api/marcom/inventory/borrow/${p1.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "supervisor",
        "x-user-name": "Approver 1",
      },
      body: JSON.stringify({ status: "APPROVED" }),
    }),
    { params: Promise.resolve({ id: p1.id }) }
  );
  assert.equal(appP1.status, 200);

  // Approver 2 attempts to approve p2 -> 422 Conflict!
  const appP2 = await putBorrow(
    new Request(`http://localhost:3000/api/marcom/inventory/borrow/${p2.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "supervisor",
        "x-user-name": "Approver 2",
      },
      body: JSON.stringify({ status: "APPROVED" }),
    }),
    { params: Promise.resolve({ id: p2.id }) }
  );
  assert.equal(appP2.status, 422);
  const p2Err = await appP2.json();
  assert.ok(p2Err.error.includes("unit telah dialokasikan"));

  // AC-5: Return Deficit Warning Propagation
  // Create a 2-unit item
  const twoUnitRes = await postInventory(
    new Request("http://localhost:3000/api/marcom/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Dual Generator 5kVA",
        code: `GEN-${Date.now()}`,
        category: "Power",
        totalUnits: 2,
        storageLocation: "Yard B",
      }),
    })
  );
  assert.equal(twoUnitRes.status, 201);
  const twoUnitItem = await twoUnitRes.json();

  // Future approved booking needing 2 units on Dec 20
  const futureApproved = await prisma.borrowRecord.create({
    data: {
      borrowCode: `BRW-FUT-${Date.now()}`,
      borrowerName: "Big Festival",
      borrowDate: new Date("2026-12-20T00:00:00Z"),
      returnDueDate: new Date("2026-12-25T00:00:00Z"),
      status: "APPROVED",
      items: { create: [{ inventoryItemId: twoUnitItem.id, quantity: 2, conditionOut: "GOOD" }] },
    },
  });

  // Active loan needing 1 unit currently returning on Dec 15
  const activeLoan = await prisma.borrowRecord.create({
    data: {
      borrowCode: `BRW-ACT-${Date.now()}`,
      borrowerName: "Early Roadshow",
      borrowDate: new Date("2026-12-10T00:00:00Z"),
      returnDueDate: new Date("2026-12-15T00:00:00Z"),
      status: "ACTIVE",
      items: { create: [{ inventoryItemId: twoUnitItem.id, quantity: 1, conditionOut: "GOOD" }] },
    },
    include: { items: true },
  });

  // Process return with majorDamageUnits: 1 (reduces totalUnits from 2 to 1)
  const returnRes = await returnBorrow(
    new Request(`http://localhost:3000/api/marcom/inventory/borrow/${activeLoan.id}/return`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "warehouse",
        "x-user-name": "Warehouse Inspector",
      },
      body: JSON.stringify({
        returnDate: "2026-12-15",
        items: [
          {
            borrowItemId: activeLoan.items[0].id,
            goodUnits: 0,
            minorDamageUnits: 0,
            majorDamageUnits: 1,
            lostUnits: 0,
          },
        ],
      }),
    }),
    { params: Promise.resolve({ id: activeLoan.id }) }
  );
  assert.equal(returnRes.status, 200);

  // Assert future booking was flagged with DEFICIT_WARNING note
  const checkedFuture = await prisma.borrowRecord.findUnique({
    where: { id: futureApproved.id },
  });
  assert.ok(checkedFuture?.notes?.includes("[DEFICIT_WARNING]"));

  // Cleanup ADR-0102 test entities
  await prisma.borrowItem.deleteMany({
    where: {
      borrowRecordId: {
        in: [b1.id, b2.id, p1.id, p2.id, futureApproved.id, activeLoan.id],
      },
    },
  });
  await prisma.borrowRecord.deleteMany({
    where: {
      id: { in: [b1.id, b2.id, p1.id, p2.id, futureApproved.id, activeLoan.id] },
    },
  });
  await prisma.inventoryItem.deleteMany({
    where: { id: { in: [singleItem.id, twoUnitItem.id] } },
  });
});

test("API: Strict Test-Environment Header Isolation & Inventory Auth Standardization (ADR-0104)", async () => {
  const dummyId = "dummy-borrow-id-adr0104";

  // 1. Unauthenticated request to /return returns 401 (remedying non-production warehouse fallback)
  const unauthReturnReq = new Request(`http://localhost:3000/api/marcom/inventory/borrow/${dummyId}/return`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ returnNotes: "Attempting unauthenticated return" }),
  });
  const unauthReturnRes = await returnBorrow(unauthReturnReq, { params: Promise.resolve({ id: dummyId }) });
  assert.equal(unauthReturnRes.status, 401);
  const unauthReturnBody = await unauthReturnRes.json();
  assert.equal(unauthReturnBody.error, "Unauthorized");

  // 2. Production header spoofing simulation: x-user-role must be strictly ignored outside NODE_ENV === 'test'
  const originalEnv = process.env.NODE_ENV;
  try {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";

    // Attempt spoofed POST /borrow
    const spoofedBorrowRes = await postBorrow(
      new Request("http://localhost:3000/api/marcom/inventory/borrow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": "admin",
          "x-user-name": "Hacker Admin",
        },
        body: JSON.stringify({ borrowerName: "Spoofed Borrower" }),
      })
    );
    assert.equal(spoofedBorrowRes.status, 401);

    // Attempt spoofed PUT /borrow/[id]
    const spoofedPutRes = await putBorrow(
      new Request(`http://localhost:3000/api/marcom/inventory/borrow/${dummyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": "admin",
        },
        body: JSON.stringify({ status: "APPROVED" }),
      }),
      { params: Promise.resolve({ id: dummyId }) }
    );
    assert.equal(spoofedPutRes.status, 401);

    // Attempt spoofed POST /return
    const spoofedReturnRes = await returnBorrow(
      new Request(`http://localhost:3000/api/marcom/inventory/borrow/${dummyId}/return`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": "warehouse",
        },
        body: JSON.stringify({ returnNotes: "Spoofed return" }),
      }),
      { params: Promise.resolve({ id: dummyId }) }
    );
    assert.equal(spoofedReturnRes.status, 401);

    // Attempt spoofed POST /settle
    const spoofedSettleRes = await settleBorrow(
      new Request(`http://localhost:3000/api/marcom/inventory/borrow/${dummyId}/settle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": "warehouse",
        },
        body: JSON.stringify({ settlementType: "CASH_TRANSFER" }),
      }),
      { params: Promise.resolve({ id: dummyId }) }
    );
    assert.equal(spoofedSettleRes.status, 401);
  } finally {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
  }
});
