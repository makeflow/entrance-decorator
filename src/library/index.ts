interface EntranceInstanceData {
  visitingKeySet: Set<string>;
  cachedEntranceMap: Map<string, unknown>;
}

const entranceInstanceDataMap = new WeakMap<object, EntranceInstanceData>();

export function entrance(
  _prototype: object,
  key: string,
  {get: getter}: PropertyDescriptor,
): PropertyDescriptor {
  if (!getter) {
    throw new Error('Decorator `@entrance` applies to getter only');
  }

  return {
    get() {
      let data = entranceInstanceDataMap.get(this);

      if (!data) {
        data = {
          visitingKeySet: new Set(),
          cachedEntranceMap: new Map(),
        };

        entranceInstanceDataMap.set(this, data);
      }

      let {cachedEntranceMap, visitingKeySet} = data;

      if (cachedEntranceMap.has(key)) {
        return cachedEntranceMap.get(key);
      }

      let outermost = visitingKeySet.size === 0;

      if (visitingKeySet.has(key)) {
        throw new Error(
          `Circular entrances: ${[...visitingKeySet, key].join(' -> ')}`,
        );
      }

      visitingKeySet.add(key);

      let entrance = getter.call(this) as unknown;

      cachedEntranceMap.set(key, entrance);

      if (outermost) {
        visitingKeySet.clear();
      }

      return entrance;
    },
  };
}

export default entrance;