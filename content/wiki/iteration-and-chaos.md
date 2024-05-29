---
title: Iteration and chaos
description: A brief introduction to iteration and chaos
date: 2024-05-26T14:18
update: 2024-05-29T14:54
tags:
  - wiki/mathematics
  - wiki/computational-physics
id: wiki20240526141811
dg-publish: true
maturity: sapling
---
# Iterative methods for computing physical quantities

If a physical quantity is involved in the expression of itself :
$$
f(x)=x \tag{1-1}
$$
Iterative methods are usually employed for solving it.

## Direct iterative method

Let $f(x_n)=x_{n+1}$，compute from a preset $x_0$ until $x_n=x_{n+1}$.

Considering the limited iterative steps in real world, a strict equation is hard to get. Usually, a convergence factor $\epsilon$ is used for qualification:
$$
\bigg | \frac{x_{n+1}-x_n}{x_n} \bigg | \leq \epsilon \tag{1-2}
$$

## Newton iterative method (Newton-Raphson method)

A general form of the equation for finding the roots: $g(x)=0$.

If the root of the equation is $x_0$, expanding the equation around the neighborhood of $x_0$ using a Taylor series, we proceed to approximate it with a first-order approximation:
$$g(x) \approx g(x_0) + g'(x_0)(x-x_0) = 0 \tag{1-3}$$

Then we get:
$$x = x_0- \frac{g(x_0)}{g'(x_0)} \tag{1-4}$$

In practical computations, an initial value $x_0$​ is preliminarily estimated, thus $x_1 = x_0 - \frac{g(x_0)}{g'(x_0)}$ is calculated. And $x_1$ is subsequently used for calculating $x_2$, then $x_2$ for $x_3$ ... That is:
$$x_{n+1} = x_n - \frac{g(x_n)}{g'(x_n)} \tag{1-5}$$

Besides the precision of relative error given by (1-2), another convergence factor $\delta$ is used as the precision of absolute error in Newton iterative method:
$$|g(x_{n+1})| < \delta \tag{1-6}$$

The Newton-Raphson method is renowned for its rapid convergence due to its consideration of the function's first derivative. This is its primary advantage, which has led to its widespread application. However, the Newton-Raphson method encounters limitations when iteratively calculating the function value and its first derivative value. This is particularly evident when attempting to solve equations with complex functions that pose challenges in evaluating their first derivatives.

## Hybrid input iterative method

For complex physical systems, the precision of convergence sometimes can hardly achieved even after numerous  steps of iteration.

```poetry
To be continued...
```
