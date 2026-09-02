import { useState } from 'react'

const tokenKey = 'ff-reimburse:token'

export function setToken(token: string) {
  localStorage.setItem(tokenKey, token)
}

export function getToken() {
  return localStorage.getItem(tokenKey)
}

export function useToken() {
  const [token] = useState(() => getToken())
  return token
}
