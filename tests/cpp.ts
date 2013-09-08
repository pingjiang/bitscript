// TODO: It's bad that there's no warning for this:
//
//   class Foo {
//     Foo foo() {
//       return this;
//     }
//   }
//
// Maybe make an explicit copy operator?

test([
  'class Foo {',
  '  Foo foo();',
  '}',
  '',
  'class Bar : Foo {',
  '  over ref Foo foo() {',
  '  }',
  '}',
  '',
  'int main() {',
  '  return 0;',
  '}',
], [
  'error on line 6 of <stdin>: foo must have the same signature as the function it overrides (Function<ref Foo> overrides Function<Foo>)',
  '',
  '  over ref Foo foo() {',
  '               ~~~',
]);

test([
  'class Foo {',
  '  void foo();',
  '}',
  '',
  'class Bar : Foo {',
  '  over void foo() {',
  '  }',
  '}',
  '',
  'int main() {',
  '  Foo foo;',
  '  Bar bar;',
  '  return 0;',
  '}',
], [
  'error on line 11 of <stdin>: cannot create variable of type Foo',
  '',
  '  Foo foo;',
  '  ~~~',
]);

test([
  'void foo(Foo foo) {',
  '  if (true) {} // The error in the function definition should not cause a problem here',
  '}',
], [
  'error on line 1 of <stdin>: Foo is not defined',
  '',
  'void foo(Foo foo) {',
  '         ~~~',
]);

test([
  'class Foo {',
  '  Foo a;',
  '  ref Foo b;',
  '  owned Foo c;',
  '}',
  '',
  'int main() {',
  '  Foo a;',
  '  ref Foo b;',
  '  owned Foo c;',
  '  return 0;',
  '}',
], [
  'error on line 8 of <stdin>: variable of type Foo must be initialized',
  '',
  '  Foo a;',
  '      ^',
]);

test([
  'class Foo {',
  '  int x;',
  '}',
  '',
  'class Bar : Foo {',
  '  int y;',
  '}',
  '',
  'int main() {',
  '  Foo foo = new Bar(1, 2); // Slicing via copy is forbidden',
  '  return 0;',
  '}',
], [
  'error on line 10 of <stdin>: cannot convert from pointer of type owned Bar to value of type Foo',
  '',
  '  Foo foo = new Bar(1, 2); // Slicing via copy is forbidden',
  '            ~~~~~~~~~~~~~',
]);

testCPP([
  'class Foo {',
  '  int x;',
  '}',
  '',
  'int foo(Foo foo) {',
  '  return foo.x;',
  '}',
  '',
  'int bar(ref Foo foo) {',
  '  return foo.x;',
  '}',
  '',
  'int main() {',
  '  Foo value = new Foo(100);',
  '  owned Foo unique = new Foo(200);',
  '',
  '  ref Foo raw = null;',
  '  raw = value;',
  '  raw = unique;',
  '  value = raw;',
  '  value = unique;',
  '  value = new Foo(300);',
  '',
  '  foo(value);',
  '  foo(raw);',
  '  foo(unique);',
  '  bar(value);',
  '  bar(raw);',
  '  bar(unique);',
  '',
  '  return 0;',
  '}',
], [
  '#include <memory>',
  'struct Foo;',
  'struct Foo {',
  '  int x;',
  '  Foo(int x);',
  '};',
  'int foo(Foo foo);',
  'int bar(Foo *foo);',
  'int main();',
  'Foo::Foo(int x) : x(x) {',
  '}',
  'int foo(Foo foo) {',
  '  return foo.x;',
  '}',
  'int bar(Foo *foo) {',
  '  return foo->x;',
  '}',
  'int main() {',
  '  Foo value = Foo(100);',
  '  std::unique_ptr<Foo> unique = std::unique_ptr<Foo>(new Foo(200));',
  '  Foo *raw = nullptr;',
  '  raw = &value;',
  '  raw = unique.get();',
  '  value = *raw;',
  '  value = *unique.get();',
  '  value = Foo(300);',
  '  foo(value);',
  '  foo(*raw);',
  '  foo(*unique.get());',
  '  bar(&value);',
  '  bar(raw);',
  '  bar(unique.get());',
  '  return 0;',
  '}',
]);

testCPP([
  'class Foo {',
  '  int x;',
  '}',
  '',
  'void values() {',
  '  List<int> ints;',
  '  ints.push(1);',
  '  ints.unshift(ints.pop());',
  '',
  '  List<Foo> values = new List<Foo>();',
  '  values.push(new Foo(1));',
  '  values.unshift(values.pop());',
  '',
  '  List<ref Foo> raws = new List<ref Foo>();',
  '  raws.push(new Foo(1));',
  '  raws.unshift(raws.pop());',
  '',
  '  List<owned Foo> uniques = new List<owned Foo>();',
  '  uniques.push(new Foo(1));',
  '  uniques.unshift(uniques.pop());',
  '}',
  '',
  'void uniques() {',
  '  owned List<int> ints = new List<int>();',
  '  ints.push(1);',
  '  ints.unshift(ints.pop());',
  '',
  '  owned List<Foo> values = new List<Foo>();',
  '  values.push(new Foo(1));',
  '  values.unshift(values.pop());',
  '',
  '  owned List<ref Foo> raws = new List<ref Foo>();',
  '  raws.push(new Foo(1));',
  '  raws.unshift(raws.pop());',
  '',
  '  owned List<owned Foo> uniques = new List<owned Foo>();',
  '  uniques.push(new Foo(1));',
  '  uniques.unshift(uniques.pop());',
  '}',
  '',
  'int main() {',
  '  values();',
  '  uniques();',
  '  return 0;',
  '}',
], [
  '#include <memory>',
  '#include <vector>',
  'template <typename T>',
  'T List_pop(std::vector<T> *list) {',
  '  T t = std::move(*(list->end() - 1));',
  '  list->pop_back();',
  '  return std::move(t);',
  '}',
  'template <typename T>',
  'void List_unshift(std::vector<T> *list, T t) {',
  '  list->insert(list->begin(), std::move(t));',
  '}',
  'struct Foo;',
  'struct Foo {',
  '  int x;',
  '  Foo(int x);',
  '};',
  'void values();',
  'void uniques();',
  'int main();',
  'Foo::Foo(int x) : x(x) {',
  '}',
  'void values() {',
  '  std::vector<int> ints = std::vector<int>();',
  '  ints.push_back(1);',
  '  List_unshift(&ints, List_pop(&ints));',
  '  std::vector<Foo> values = std::vector<Foo>();',
  '  values.push_back(Foo(1));',
  '  List_unshift(&values, List_pop(&values));',
  '  std::vector<Foo *> raws = std::vector<Foo *>();',
  '  raws.push_back(std::unique_ptr<Foo>(new Foo(1)).get());',
  '  List_unshift(&raws, List_pop(&raws));',
  '  std::vector<std::unique_ptr<Foo>> uniques = std::vector<std::unique_ptr<Foo>>();',
  '  uniques.push_back(std::unique_ptr<Foo>(new Foo(1)));',
  '  List_unshift(&uniques, List_pop(&uniques));',
  '}',
  'void uniques() {',
  '  std::unique_ptr<std::vector<int>> ints = std::unique_ptr<std::vector<int>>(new std::vector<int>());',
  '  ints->push_back(1);',
  '  List_unshift(ints.get(), List_pop(ints.get()));',
  '  std::unique_ptr<std::vector<Foo>> values = std::unique_ptr<std::vector<Foo>>(new std::vector<Foo>());',
  '  values->push_back(Foo(1));',
  '  List_unshift(values.get(), List_pop(values.get()));',
  '  std::unique_ptr<std::vector<Foo *>> raws = std::unique_ptr<std::vector<Foo *>>(new std::vector<Foo *>());',
  '  raws->push_back(std::unique_ptr<Foo>(new Foo(1)).get());',
  '  List_unshift(raws.get(), List_pop(raws.get()));',
  '  std::unique_ptr<std::vector<std::unique_ptr<Foo>>> uniques = std::unique_ptr<std::vector<std::unique_ptr<Foo>>>(new std::vector<std::unique_ptr<Foo>>());',
  '  uniques->push_back(std::unique_ptr<Foo>(new Foo(1)));',
  '  List_unshift(uniques.get(), List_pop(uniques.get()));',
  '}',
  'int main() {',
  '  values();',
  '  uniques();',
  '  return 0;',
  '}',
]);

testCPP([
  'int main() {',
  '  Math.E;',
  '  Math.PI;',
  '  Math.NAN;',
  '  Math.INFINITY;',
  '  Math.cos(1.5);',
  '  Math.sin(1.5);',
  '  Math.tan(1.5);',
  '  Math.acos(1.5);',
  '  Math.asin(1.5);',
  '  Math.atan(1.5);',
  '  Math.atan2(1.5, 2.5);',
  '  Math.round(1.5);',
  '  Math.floor(1.5);',
  '  Math.ceil(1.5);',
  '  Math.abs(1.5);',
  '  Math.log(1.5);',
  '  Math.exp(1.5);',
  '  Math.sqrt(1.5);',
  '  Math.pow(1.5, 2.5);',
  '  Math.min(1.5, 2.5);',
  '  Math.max(1.5, 2.5);',
  '  Math.random();',
  '  Math.dtoi(1.5);',
  '  return 0;',
  '}',
], [
  '#include <math.h>',
  '#include <stdlib.h>',
  'double Math_random() {',
  '  return (double)rand() / (double)RAND_MAX;',
  '}',
  'int main();',
  'int main() {',
  '  2.718281828459045;',
  '  3.141592653589793;',
  '  NAN;',
  '  INFINITY;',
  '  cos(1.5);',
  '  sin(1.5);',
  '  tan(1.5);',
  '  acos(1.5);',
  '  asin(1.5);',
  '  atan(1.5);',
  '  atan2(1.5, 2.5);',
  '  round(1.5);',
  '  floor(1.5);',
  '  ceil(1.5);',
  '  fabs(1.5);',
  '  log(1.5);',
  '  exp(1.5);',
  '  sqrt(1.5);',
  '  pow(1.5, 2.5);',
  '  fmin(1.5, 2.5);',
  '  fmax(1.5, 2.5);',
  '  Math_random();',
  '  static_cast<int>(1.5);',
  '  return 0;',
  '}',
]);

testCPP([
  'class Foo {',
  '  bool foo() {',
  '    return 1 != 2; // Should not compare using pointers',
  '  }',
  '}',
], [
  'struct Foo;',
  'struct Foo {',
  '  Foo();',
  '  bool foo();',
  '};',
  'Foo::Foo() {',
  '}',
  'bool Foo::foo() {',
  '  return 1 != 2;',
  '}',
]);

testCPP([
  'class Foo {',
  '  ref Bar bar; // Should not cause Bar to move before Foo',
  '}',
  'class Bar {',
  '}',
], [
  'struct Foo;',
  'struct Bar;',
  'struct Foo {',
  '  Bar *bar;',
  '  Foo(Bar *bar);',
  '};',
  'struct Bar {',
  '  Bar();',
  '};',
  'Foo::Foo(Bar *bar) : bar(bar) {',
  '}',
  'Bar::Bar() {',
  '}',
]);

testCPP([
  'class Foo {',
  '  Bar bar; // Should cause Bar to move before Foo',
  '}',
  'class Bar {',
  '}',
], [
  'struct Bar;',
  'struct Foo;',
  'struct Bar {',
  '  Bar();',
  '};',
  'struct Foo {',
  '  Bar bar;',
  '  Foo(Bar bar);',
  '};',
  'Bar::Bar() {',
  '}',
  'Foo::Foo(Bar bar) : bar(bar) {',
  '}',
]);

testCPP([
  'class Foo {',
  '  Baz baz; // Should cause Bar and Baz to move before Foo',
  '}',
  'class Bar {',
  '}',
  'class Baz : Bar {',
  '}',
], [
  'struct Bar;',
  'struct Baz;',
  'struct Foo;',
  'struct Bar {',
  '  Bar();',
  '  virtual ~Bar() {',
  '  }',
  '};',
  'struct Baz : Bar {',
  '  Baz();',
  '};',
  'struct Foo {',
  '  Baz baz;',
  '  Foo(Baz baz);',
  '};',
  'Bar::Bar() {',
  '}',
  'Baz::Baz() : Bar() {',
  '}',
  'Foo::Foo(Baz baz) : baz(baz) {',
  '}',
]);

testCPP([
  'class Foo {',
  '  Baz baz; // Should cause Bar and Baz to move before Foo',
  '}',
  'class Baz : Bar {',
  '}',
  'class Bar {',
  '}',
], [
  'struct Bar;',
  'struct Baz;',
  'struct Foo;',
  'struct Bar {',
  '  Bar();',
  '  virtual ~Bar() {',
  '  }',
  '};',
  'struct Baz : Bar {',
  '  Baz();',
  '};',
  'struct Foo {',
  '  Baz baz;',
  '  Foo(Baz baz);',
  '};',
  'Bar::Bar() {',
  '}',
  'Baz::Baz() : Bar() {',
  '}',
  'Foo::Foo(Baz baz) : baz(baz) {',
  '}',
]);
