# Good Router
[![Build Status](https://travis-ci.org/LuvDaSun/goodrouter.svg?branch=master)](https://travis-ci.org/LuvDaSun/goodrouter)

A good router should:

- [x] work in a server or a client (or any other) environment
- [x] be able to contruct routes based on their name
- [x] should have a simple API!
- [x] have support for parent / child routes
- [x] not do the actual navigation!
- [x] be framework agnostic
- [x] have setup and teardown hooks that could be used for subscription management

## Route lifecycle

Route lifecycle

### setup

Only executed for new routes, so if the parent stays the same, this is not executed for
that parent. Very useful for setting up subscriptions in a SPA.

parent → child

### validate

Return `true` if the route is valid. If `false` is returned, no routing is performed!
Always executed for the entire route stack, but stops when `false` is returned.
Useful to perform re-routing, for instance for authorization redirects.

parent → child

### render

Return the object that is the result of the route. This could be (a piece of) HTML or
a React component. This hook is executed for the entire route stack.

child → parent

### teardown

The opposite of the setup phase, and therefore very useful for tearing down subscriptions.

child → parent
