const products = [
  { id: 1, name: 'Mechanical Keyboard', price: 4999 },
  { id: 2, name: 'USB-C Dock', price: 3499 },
  { id: 3, name: 'Wireless Mouse', price: 1999 }
];

export async function listProducts() {
  await new Promise(resolve => setTimeout(resolve, 50));
  return products;
}
