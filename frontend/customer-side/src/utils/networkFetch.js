function notify(name) {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(name));
}
export async function networkFetch(input, options) {
  try {
    const response = await fetch(input, options);
    notify('fixmybuddy:connection-response');
    return response;
  } catch (error) {
    if (error instanceof TypeError) notify('fixmybuddy:connection-error');
    throw error;
  }
}

