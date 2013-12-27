enum TypeKind {
  VALUE, // Is this a value type (is this copied on assignment)?
  POINTER, // Is this a pointer to a value or null?
  REFERENCE, // Is this a pointer that is automatically dereferenced and cannot be initialized with a null literal?
}

enum TypeModifier {
  FINAL = 1, // Did this come from a final variable?
  STORAGE = 2, // Can this be stored to (is this an L-value)?
  INSTANCE = 4, // Is this an instance of the type instead of the type itself?
}

enum FunctionKind {
  NORMAL = 1,
  CONSTRUCTOR = 2, // Is this new()?
  DESTRUCTOR = 4, // Is this delete()?
  COPY_CONSTRUCTOR = 8, // Is this copy()?
  MOVE_DESTRUCTOR = 16, // Is this move()?
}

class Type {
  parameters: TypeParameter[] = [];

  constructor(
    public byteAlignment: number,
    public byteSize: number) {
  }

  wrapValue(): WrappedType {
    return new WrappedType(TypeKind.VALUE, this, TypeModifier.INSTANCE, []);
  }

  wrapPointer(): WrappedType {
    return new WrappedType(TypeKind.POINTER, this, TypeModifier.INSTANCE, []);
  }

  wrapReference(): WrappedType {
    return new WrappedType(TypeKind.REFERENCE, this, TypeModifier.INSTANCE, []);
  }

  wrapValueType(): WrappedType {
    return new WrappedType(TypeKind.VALUE, this, 0, []);
  }

  wrapPointerType(): WrappedType {
    return new WrappedType(TypeKind.POINTER, this, 0, []);
  }

  wrapReferenceType(): WrappedType {
    return new WrappedType(TypeKind.REFERENCE, this, 0, []);
  }

  asString(): string {
    assert(false);
    return '';
  }
}

class SpecialType extends Type {
  constructor(
    byteSize: number,
    public name: string) {
    super(byteSize, byteSize);
  }

  asString(): string {
    return this.name;
  }
}

class FunctionType extends Type {
  constructor(
    public result: WrappedType,
    public args: WrappedType[]) {
    super(0, 0);
  }

  asString(): string {
    return this.result.asString() + ' function(' + this.args.map(t => t.asString()).join(', ') + ')';
  }
}

class ObjectType extends Type {
  constructorType: FunctionType = null;
  baseType: ObjectType = null;

  // vtableByteOffset: number = 0;
  // vtable: Symbol[] = [];

  // Other object types that have this type as a base?
  derivedTypes: ObjectType[] = [];

  // Does this object type have a (possibly inherited) function without a body?
  isAbstract: boolean = false;

  // Is this object type allowed to be the base class of another object type?
  isSealed: boolean = false;

  constructor(
    public name: string,
    public scope: Scope) {
    super(0, 0);
  }

  asString(): string {
    return this.name;
  }

  // needsVTable(): boolean {
  //   return this.vtable.length !== 0;
  // }
}

class TypeParameter extends Type {
  constructor(
    public name: string) {
    super(4, 4); // All type parameters are pointers
  }

  asString(): string {
    return this.name;
  }
}

class Substitution {
  constructor(
    public parameter: TypeParameter,
    public type: WrappedType) {
  }
}

class WrappedType {
  constructor(
    public kind: TypeKind,
    public innerType: Type,
    public modifiers: number,
    public substitutions: Substitution[]) {
    assert(innerType !== null);
  }

  isValue(): boolean {
    return this.kind === TypeKind.VALUE;
  }

  isPointer(): boolean {
    return this.kind === TypeKind.POINTER;
  }

  isReference(): boolean {
    return this.kind === TypeKind.REFERENCE;
  }

  isFinal(): boolean {
    return (this.modifiers & TypeModifier.FINAL) !== 0;
  }

  isStorage(): boolean {
    return (this.modifiers & TypeModifier.STORAGE) !== 0;
  }

  isInstance(): boolean {
    return (this.modifiers & TypeModifier.INSTANCE) !== 0;
  }

  isError(): boolean {
    return this.innerType === NativeTypes.ERROR;
  }

  isCircular(): boolean {
    return this.innerType === NativeTypes.CIRCULAR;
  }

  isNull(): boolean {
    return this.innerType === NativeTypes.NULL;
  }

  isVoid(): boolean {
    return this.innerType === NativeTypes.VOID;
  }

  isInt(): boolean {
    return this.innerType === NativeTypes.INT;
  }

  isFloat(): boolean {
    return this.innerType === NativeTypes.FLOAT;
  }

  isDouble(): boolean {
    return this.innerType === NativeTypes.DOUBLE;
  }

  isBool(): boolean {
    return this.innerType === NativeTypes.BOOL;
  }

  isNumeric():  boolean {
    return this.isInt() || this.isFloat() || this.isDouble();
  }

  isPrimitive(): boolean {
    return this.isNumeric() || this.isBool();
  }

  isObject(): boolean {
    return this.innerType instanceof ObjectType;
  }

  isFunction(): boolean {
    return this.innerType instanceof FunctionType;
  }

  asObject(): ObjectType {
    return this.innerType instanceof ObjectType ? <ObjectType>this.innerType : null;
  }

  asFunction(): FunctionType {
    return this.innerType instanceof FunctionType ? <FunctionType>this.innerType : null;
  }

  byteAlignment(): number {
    return this.isPointer() ? 4 : this.innerType.byteAlignment;
  }

  byteSize(): number {
    return this.isPointer() ? 4 : this.innerType.byteSize;
  }

  asString(): string {
    return (
      this.innerType.asString() +
      (this.substitutions.length > 0 ? '<' + TypeLogic.filterSubstitutionsForType(
        this.substitutions, this.innerType).map(s => s.type.asString()).join(', ') + '>' : '') +
      (this.isPointer() ? '*' : this.isReference() ? '&' : '')
    );
  }

  toString(): string {
    return (this.isInstance() ? this.isPointer() ? 'pointer of ' : this.isReference() ? 'reference of ' : 'value of ' : '') + 'type ' + this.asString();
  }

  withKind(kind: TypeKind): WrappedType {
    return new WrappedType(kind, this.innerType, this.modifiers, this.substitutions);
  }

  withModifier(flag: number): WrappedType {
    return new WrappedType(this.kind, this.innerType, this.modifiers | flag, this.substitutions);
  }

  withoutModifier(flag: number): WrappedType {
    return new WrappedType(this.kind, this.innerType, this.modifiers & ~flag, this.substitutions);
  }
}
