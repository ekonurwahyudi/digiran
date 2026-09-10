import assert from 'node:assert/strict'
import { test } from 'node:test'
import { baseMonthlyBudget, baseQuarterBudget, periodBudget, scopedRraTotals } from './dashboard-budget'

const budget = { q3Amount: 1613041533, julAmount: 537680511, augAmount: 537680511, sepAmount: 537680511 }

test('Q3 and July–September retain the allocated budget with August RRA', () => {
  assert.equal(baseQuarterBudget(budget, 3), 1613041533)
  for (const month of [6, 7, 8]) assert.equal(baseMonthlyBudget(budget, month), 537680511)
  const august = periodBudget(baseMonthlyBudget(budget, 7), 2267298763, 1369823644, 251041800)
  assert.equal(august.budget, 537680511)
  assert.equal(august.remaining, 1184113830)
  assert.equal(august.outlook.toFixed(1), '57.8')
  assert.equal(periodBudget(baseQuarterBudget(budget, 3), 2267298763, 1369823644, 251041800).remaining, 2259474852)
})

test('HO to area transfer counts only the HO donor; other HOs and periods are excluded', () => {
  const lines = [
    { regionalCode: 'HO-1', side: 'DONOR', amount: 200, rraLog: { month: 8 } },
    { regionalCode: 'AREA-1', side: 'PENERIMA', amount: 200, rraLog: { month: 8 } },
    { regionalCode: 'HO-2', side: 'PENERIMA', amount: 300, rraLog: { month: 8 } },
    { regionalCode: 'HO-1', side: 'PENERIMA', amount: 50, rraLog: { month: 9 } },
  ]
  assert.deepEqual(scopedRraTotals(lines, 'HO-1', [8]), { incoming: 0, outgoing: 200 })
  assert.deepEqual(scopedRraTotals(lines, 'HO-1', [7, 8, 9]), { incoming: 50, outgoing: 200 })
  assert.deepEqual(scopedRraTotals(lines, undefined, [8]), { incoming: 0, outgoing: 0 })
})

test('zero monthly allocations are preserved and legacy unallocated quarters are divided evenly', () => {
  assert.equal(baseMonthlyBudget({ q3Amount: 900, julAmount: 900, augAmount: 0, sepAmount: 0 }, 7), 0)
  assert.equal(baseMonthlyBudget({ q3Amount: 900 }, 7), 300)
  assert.equal(baseMonthlyBudget({ q3Amount: 900, julAmount: 0, augAmount: 0, sepAmount: 0 }, 7), 300)
})

test('remaining can be negative and outlook handles no available budget', () => {
  assert.equal(periodBudget(100, 0, 80, 40).remaining, -20)
  assert.equal(periodBudget(100, 0, 80, 40).outlook, 120)
  assert.equal(periodBudget(0, 0, 0, 0).outlook, 0)
  assert.equal(periodBudget(0, 100, 20, 30).outlook, 50)
})

test('legacy dashboard includes HO RRA and excludes area recipients without organization sessions', () => {
  const lines = [
    { regionalCode: 'A-DEFA-HO', side: 'DONOR', amount: 200, rraLog: { month: 8 } },
    { regionalCode: 'AREA-1', side: 'PENERIMA', amount: 200, rraLog: { month: 8 } },
    { regionalCode: 'HO', side: 'PENERIMA', amount: 50, rraLog: { month: 8 } },
  ]
  assert.deepEqual(scopedRraTotals(lines, undefined, [8], true), { incoming: 50, outgoing: 200 })
  assert.deepEqual(scopedRraTotals(lines, 'A-DEFA-HO', [8], true), { incoming: 0, outgoing: 200 })
})
