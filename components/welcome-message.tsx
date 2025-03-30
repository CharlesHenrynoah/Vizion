"use client"

import { useState } from "react"

export function WelcomeMessage() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) {
    return null
  }

  return null
}

