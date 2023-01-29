# GoodRouter, TypeScript edition

A good router should:

- [x] work in a server or a client (or any other) environment
- [x] be able to construct routes based on their name
- [x] should have a simple API!
- [x] not do the actual navigation!
- [x] be framework agnostic
- [x] be very minimal and simple!

Check out our (website)[https://www.goodrouter.org], the (documentation) [https://ts.goodrouter.org]. And feel free to join our (Discord server)[https://discord.gg/BJ8v7xTq8d]!

## Example

```typescript
const router = new Router();

router.insertRoute("all-products", "/product/all");
router.insertRoute("product-detail", "/product/{id}");

// And now we can parse routes!

{
  const route = router.parseRoute("/not-found");
  assert.equal(route, null);
}

{
  const route = router.parseRoute("/product/all");
  assert.deepEqual(route, {
    name: "all-products",
    parameters: {},
  });
}

{
  const route = router.parseRoute("/product/1");
  assert.deepEqual(route, {
    name: "product-detail",
    parameters: {
      id: "1",
    },
  });
}

// And we can stringify routes

{
  const path = router.stringifyRoute({
    name: "all-products",
    parameters: {},
  });
  assert.equal(path, "/product/all");
}

{
  const path = router.stringifyRoute({
    name: "product-detail",
    parameters: {
      id: "2",
    },
  });
  assert.equal(path, "/product/2");
}
```
