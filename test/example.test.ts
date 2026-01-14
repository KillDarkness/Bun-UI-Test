/**
 * Testes de exemplo para demonstrar o Bun Test UI
 */

import { test, expect, describe } from "bun:test";

describe("Math operations", () => {
  test("addition works correctly", () => {
    expect(1 + 1).toBe(2);
    expect(5 + 3).toBe(8);
  });

  test("subtraction works correctly", () => {
    expect(5 - 3).toBe(2);
    expect(10 - 7).toBe(3);
  });

  test("multiplication works correctly", () => {
    expect(2 * 3).toBe(6);
    expect(5 * 4).toBe(20);
  });
});

describe("String operations", () => {
  test("concatenation works", () => {
    expect("Hello" + " " + "World").toBe("Hello World");
  });

  test("length property works", () => {
    expect("test".length).toBe(4);
    expect("".length).toBe(0);
  });

  test("uppercase conversion", () => {
    expect("hello".toUpperCase()).toBe("HELLO");
  });
});

describe("Array operations", () => {
  test("push adds element", () => {
    const arr = [1, 2, 3];
    arr.push(4);
    expect(arr).toEqual([1, 2, 3, 4]);
  });

  test("filter works correctly", () => {
    const arr = [1, 2, 3, 4, 5];
    const even = arr.filter(n => n % 2 === 0);
    expect(even).toEqual([2, 4]);
  });

  test("map transforms array", () => {
    const arr = [1, 2, 3];
    const doubled = arr.map(n => n * 2);
    expect(doubled).toEqual([2, 4, 6]);
  });
});

describe("Async operations", () => {
  test("async/await works", async () => {
    const promise = Promise.resolve(42);
    const result = await promise;
    expect(result).toBe(42);
  });

  test("setTimeout works", async () => {
    const start = Date.now();
    await new Promise(resolve => setTimeout(resolve, 100));
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(100);
  });
});

// Teste que falha intencionalmente para demonstrar visualização de falhas
describe("Failing tests (for demo)", () => {
  test("this test will fail", () => {
    expect(1 + 1).toBe(3); // Intencionalmente errado
  });
});
