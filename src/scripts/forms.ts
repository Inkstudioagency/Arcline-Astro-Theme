// Replaces Webflow's hosted form backend (which only works on Webflow hosting).
// Submissions are POSTed as JSON to PUBLIC_FORM_ENDPOINT, and the original `.w-form-done` /
// `.w-form-fail` blocks are shown exactly as Webflow did.
// The listener runs in the capture phase so it runs before webflow.js's delegated submit handler.

const endpoint = import.meta.env.PUBLIC_FORM_ENDPOINT as string | undefined;

function setState(wrapper: HTMLElement, form: HTMLFormElement, state: 'idle' | 'done' | 'fail') {
  const done = wrapper.querySelector<HTMLElement>('.w-form-done');
  const fail = wrapper.querySelector<HTMLElement>('.w-form-fail');
  if (state === 'done') {
    form.style.display = 'none';
    if (done) done.style.display = 'block';
    if (fail) fail.style.display = 'none';
  } else if (state === 'fail') {
    if (fail) fail.style.display = 'block';
  } else if (fail) {
    fail.style.display = 'none';
  }
}

document.addEventListener(
  'submit',
  async (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    const wrapper = form.closest<HTMLElement>('.w-form');
    if (!wrapper) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const submit = form.querySelector<HTMLInputElement>('[type="submit"]');
    const label = submit?.value;
    const wait = submit?.dataset.wait;
    if (submit && wait) submit.value = wait;
    submit?.setAttribute('disabled', '');
    setState(wrapper, form, 'idle');

    const data = Object.fromEntries(new FormData(form).entries());
    // Honeypot: real visitors never fill this field.
    if (data._gotcha) return setState(wrapper, form, 'done');
    delete data._gotcha;

    try {
      if (!endpoint) throw new Error('PUBLIC_FORM_ENDPOINT is not configured');
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ form: form.dataset.name || form.name || 'Form', page: location.pathname, ...data }),
      });
      if (!res.ok) throw new Error(`Form endpoint responded ${res.status}`);
      setState(wrapper, form, 'done');
      form.reset();
    } catch (error) {
      console.warn('[forms]', error);
      setState(wrapper, form, 'fail');
    } finally {
      if (submit) {
        submit.removeAttribute('disabled');
        if (label !== undefined) submit.value = label;
      }
    }
  },
  true,
);
