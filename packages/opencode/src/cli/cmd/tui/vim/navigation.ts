import type { ScrollBoxRenderable } from "@opentui/core"
import type { AssistantMessage, UserMessage } from "@opencode-ai/sdk/v2"
import type { Part } from "@opencode-ai/sdk/v2"

export interface MessageWithParts {
  id: string
  role: string
  time: { created: number }
  [key: string]: any
}

export interface SyncData {
  message: Record<string, (AssistantMessage | UserMessage)[]>
  part: Record<string, Part[]>
  session_status?: Record<string, any>
  permission?: Record<string, any>
  config: any
}

/**
 * Find the message currently at or near the center of the viewport
 */
export const getCurrentMessage = (
  scroll: ScrollBoxRenderable,
  messages: () => (AssistantMessage | UserMessage)[],
  syncData: SyncData,
  sessionID: string,
) => {
  const children = scroll.getChildren()
  const messagesList = messages()
  const scrollTop = scroll.y
  const viewportHeight = scroll.height
  const scrollBottom = scrollTop + viewportHeight
  const viewportCenter = scrollTop + viewportHeight / 2

  // Create a map of part IDs to message IDs for faster lookup
  const partIdToMessageMap = new Map<string, string>()
  for (const messageId in syncData.part) {
    const parts = syncData.part[messageId] || []
    for (const part of parts) {
      partIdToMessageMap.set(`text-${part.id}`, messageId)
      // Add other potential patterns if they exist
      partIdToMessageMap.set(part.id, messageId) // Direct part ID match
    }
  }

  // Find all elements that are visible in the viewport
  const visibleElements = children
    .filter((c: any) => {
      // Check if element is visible in the viewport (partially or fully)
      const elementTop = c.y
      const elementBottom = c.y + (c.height || 0)
      const isVisible = elementTop < scrollBottom && elementBottom > scrollTop

      return isVisible && c.id
    })
    .sort((a: any, b: any) => a.y - b.y)

  // If we have visible elements, try to match them to messages
  if (visibleElements.length > 0) {
    // First, try to find elements with IDs that directly match message IDs (user messages)
    for (const element of visibleElements) {
      const matchingMessage = messagesList.find((m) => m.id === element.id)
      if (matchingMessage) {
        return matchingMessage
      }
    }

    // Second, try to find elements with IDs that match part patterns (assistant messages)
    for (const element of visibleElements) {
      const messageID = partIdToMessageMap.get(element.id)
      if (messageID) {
        const matchingMessage = messagesList.find(m => m.id === messageID)
        if (matchingMessage) {
          return matchingMessage
        }
      }

      // Special case: if element ID starts with message ID (might be a container)
      for (const message of messagesList) {
        if (element.id && element.id.startsWith(message.id)) {
          return message
        }
      }
    }
  }

  // Fallback: Find any message element that is closest to the viewport center
  if (children.length > 0 && messagesList.length > 0) {
    // Create a map of message ID to its average Y position for all its elements
    const messagePositions = new Map<string, number>()

    for (const message of messagesList) {
      // Find all elements that belong to this message
      const messageElements = children.filter((c: any) => {
        if (!c.id) return false

        // Direct match (user messages)
        if (c.id === message.id) return true

        // Part match (assistant messages) - use our precomputed map
        return partIdToMessageMap.has(c.id) && partIdToMessageMap.get(c.id) === message.id
      })

      // Calculate average position of all elements belonging to this message
      if (messageElements.length > 0) {
        const avgY = messageElements.reduce((sum: number, el: any) => sum + el.y, 0) / messageElements.length
        messagePositions.set(message.id, avgY)
      }
    }

    // Find the message with the position closest to the viewport center
    let closestMessage: AssistantMessage | UserMessage | null = null
    let minDistance = Infinity

    for (const [messageId, avgY] of messagePositions) {
      const distance = Math.abs(avgY - viewportCenter)
      if (distance < minDistance) {
        minDistance = distance
        closestMessage = messagesList.find(m => m.id === messageId) || null
      }
    }

    if (closestMessage) {
      return closestMessage
    }
  }

  // Last resort: return the most recent message
  if (messagesList.length > 0) {
    return messagesList[messagesList.length - 1]
  }

  return null
}
