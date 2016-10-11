// Store all instances for reverse compatibility (not used by respondableNext)
export const state = {
  instances: {},
  nextInstanceID: 0,
};

/**
* Recieves an instance as its only parameter.
* Returns a list of the values associated with the instance's matching queries.
* @param {Object} instance
* @return {Array} matches
*/
export function findMatches(instance) {
  const matches = [];
  for (const query of instance.queries) {
    if (query.matches) {
      matches.push(query.value);
    }
  }

  // Send matching values to user
  instance.onChangeCb(matches);
  return matches;
}


/**
 * Creates a onChange handler for resizes that change the activate / deactivate a media query.
 * Returns a function that is bound to the instance
 * @param {Object} instance
 * @return {Function} handler
 */
export function createQueryChangeHandler(findMatches, instance) {
  return function handler() {
    if (instance) {
      return findMatches(instance);
    }
  };
}

/**
 * Creates a MediaQueryList instance for each query passed in by the user.
 * registers listeners for each mediaquery one and associates the provided values
 * returns an array of MediaQueryLists.
 * @param {Object} values
 * @param {Function} listenerCallback - result of createQueryChangeHandler
 * @param {Object} matchMedia - Optional polyfill for matchMedia
 * @return {Array} queries
 */
export function mapMediaQueryLists(values, queryChangeHandler, matchMedia) {
  const queries = Object.keys(values);
  return queries.map((query) => {
    // list is a MediaQueryList instance
    const list = matchMedia(query);

    // Add the listener so we will be notified of future changes.
    list.addListener(queryChangeHandler);

    // Add a value so we will know what the current size is (in the event object).
    list.value = values[query];
    return list;
  });
}

/**
 * Takes in an instance object that was created inside of respondable.
 * @param {Object} instance
 */
export function destroyNext(instance) {
  if (instance && Object.keys(instance).length) {
    // Remove the listener for each MediaQueryList tied to this instance
    for (const mq of instance.queries) {
      mq.removeListener(instance.listenerCb);
    }

    for(const key of Object.keys(instance)) {
      delete instance[key];
    }
    return true
  } else {
    console.warn(`This instance has already been destroyed.`);
    return false;
  }
}

/**
 * Takes in an instance object that was created inside of respondable.
 * @param {Object} instance
 */
export function destroy(id) {
  if (id !== undefined && state.instances[String(id)]) {

    const instance = state.instances[String(id)];

    // Remove the listener for each MediaQueryList tied to this instance
    for (const mq of instance.queries) {
      mq.removeListener(instance.listenerCb);
    }

    delete state.instances[String(id)];
    return true;
  } else {
    console.warn(`This instance has already been destroyed.`);
    return false;
  }
}

/**
 * Main entry point for respondable. Takes the map of queries/values
 * and the callback function and registers them via MapValuesToState.
 * @param {Object} queries and values
 * @param {Function} callback
 * @return {String} instanceID
 */
export function respondableNext(values, onChangeCb, matchMediaPolyFill) {
  if (!values || typeof values !== 'object') {
    throw new Error(`Respondable requires an object as its first argument.`);
  }

  if (!onChangeCb || typeof onChangeCb !== 'function') {
    throw new Error(`Respondable requires a callback function as its second argument`);
  }

  if (matchMediaPolyFill !== undefined && typeof matchMediaPolyFill !== 'function') {
    throw new Error(`Respondable has an optional third parameter for matchMediaPolyFill of type function.`);
  }

  // Determine if matchMedia is being polyfilled (for testing or bad browsers)
  const matchMedia = typeof window === 'object' && window.matchMedia ? window.matchMedia : matchMediaPolyFill;

  // Create instance
  const instance = {};

  // Create a handler for matchMedia when a query's 'active' state changes
  instance.listenerCb = createQueryChangeHandler(findMatches, instance);

  // Callback passed in by user. Made a property for convenience
  instance.onChangeCb = onChangeCb;

  // mapMediaQueryLists will register listenerCb with all the queries
  // present (as keys) in the values object that was passed in.
  instance.queries = mapMediaQueryLists(values, instance.listenerCb, matchMedia);

  // This method will find all active queries.
  // It is more expensive than the method used in 'createQueryChangeHandler'
  findMatches(instance);

  return () => destroyNext(instance);
}

/**
 * Main entry point for respondable. Takes the map of queries:values
 * and the callback function and registers listeners for each breakpoint.
 * @param {Object} queries and values
 * @param {Function} callback
 * @return {String} instanceID
 */
export function respondable(values, onChangeCb, matchMediaPolyFill) {
  if (!values || typeof values !== 'object') {
    throw new Error(`Respondable requires an object as its first argument.`);
  }

  if (!onChangeCb || typeof onChangeCb !== 'function') {
    throw new Error(`Respondable requires a callback function as its second argument`);
  }

  if (matchMediaPolyFill !== undefined && typeof matchMediaPolyFill !== 'function') {
    throw new Error(`Respondable has an optional third parameter for matchMediaPolyFill of type function.`);
  }

  // Determine if matchMedia is being polyfilled (for testing or bad browsers)
  const matchMedia = typeof window === 'object' && window.matchMedia ? window.matchMedia : matchMediaPolyFill;

  // Create instance
  const instance = {};

  // Create a handler for matchMedia when a query's 'active' state changes
  instance.listenerCb = createQueryChangeHandler(findMatches, instance);

  // Callback passed in by user. Made a property for convenience
  instance.onChangeCb = onChangeCb;

  // mapMediaQueryLists will register listenerCb with all the queries
  // present (as keys) in the values object that was passed in.
  instance.queries = mapMediaQueryLists(values, instance.listenerCb, matchMedia);

  // This method will find all active queries.
  // It is more expensive than the method used in 'createQueryChangeHandler'
  findMatches(instance);

  state.instances[String(state.nextInstanceID)] = instance;
  state.nextInstanceID += 1;

  console.warn(`This method will behave differently in the next release. The new implementation is available as 'respondable.next'. Note that 'respondable.next' will not be deprecated in the next version.`);
  return state.nextInstanceID - 1;
}

respondable.next = respondableNext;
respondable.destroy = destroy;
