export async function fetchFirefly(
  path: string,
  token: string,
  options?: Partial<RequestInit>,
) {
  return fetch('/api' + path, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    ...options,
  }).then((res) => res.json())
}
