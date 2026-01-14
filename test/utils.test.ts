/**
 * Mais testes para demonstrar múltiplos arquivos
 */

import { test, expect, describe } from "bun:test";

describe("Object operations", () => {
  test("Object.keys returns keys", () => {
    const obj = { a: 1, b: 2, c: 3 };
    expect(Object.keys(obj)).toEqual(["a", "b", "c"]);
  });

  test("Object.values returns values", () => {
    const obj = { a: 1, b: 2, c: 3 };
    expect(Object.values(obj)).toEqual([1, 2, 3]);
  });

  test("spread operator works", () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { c: 3, d: 4 };
    const merged = { ...obj1, ...obj2 };
    expect(merged).toEqual({ a: 1, b: 2, c: 3, d: 4 });
  });
});

describe("Boolean logic", () => {
  test("AND operator", () => {
    expect(true && true).toBe(true);
    expect(true && false).toBe(false);
    expect(false && false).toBe(false);
  });

  test("OR operator", () => {
    expect(true || false).toBe(true);
    expect(false || false).toBe(false);
  });

  test("NOT operator", () => {
    expect(!true).toBe(false);
    expect(!false).toBe(true);
  });
});

describe("Type checking", () => {
  test("typeof returns correct type", () => {
    expect(typeof "hello").toBe("string");
    expect(typeof 42).toBe("number");
    expect(typeof true).toBe("boolean");
    expect(typeof undefined).toBe("undefined");
  });

  test("Array.isArray works", () => {
    expect(Array.isArray([])).toBe(true);
    expect(Array.isArray([1, 2, 3])).toBe(true);
    expect(Array.isArray("not an array")).toBe(false);
  });
});
