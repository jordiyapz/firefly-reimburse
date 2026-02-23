export async function fetchFirefly(path: string, token: string) {
  return fetch('/api' + path, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).then((res) => res.json())
}
