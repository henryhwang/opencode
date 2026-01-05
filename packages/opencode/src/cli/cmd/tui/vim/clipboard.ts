import type { AssistantMessage, UserMessage } from "@opencode-ai/sdk/v2"
import type { Part, TextPart, ToolPart, ReasoningPart, ToolState } from "@opencode-ai/sdk/v2"
import { Clipboard } from "@tui/util/clipboard"
import type { ToastContext } from "@tui/ui/toast"
import { CliRenderer } from "@opentui/core"

export interface SyncData {
  part: Record<string, Part[]>
}

/**
 * Copy content from a message to clipboard
 */
export const copyMessageContent = async (
  message: AssistantMessage | UserMessage | undefined,
  syncData: SyncData,
  toast: ToastContext,
  renderer: CliRenderer
) => {
  if (!message) {
    toast.show({
      message: "No message to copy",
      variant: "error"
    })
    return
  }

  const parts = syncData.part[message.id] ?? []

  // First, try to get non-synthetic text content (preferred)
  const nonSyntheticTextParts = parts.filter((part): part is TextPart =>
    part.type === "text" && part.synthetic !== true
  )
  if (nonSyntheticTextParts.length > 0) {
    const text = nonSyntheticTextParts
      .map((part) => part.text)
      .join("\n")
      .trim()

    if (text) {
      try {
        // Copy to clipboard using existing clipboard functionality
        const base64 = Buffer.from(text).toString("base64")
        const osc52 = `\x1b]52;c;${base64}\x07`
        const finalOsc52 = process.env["TMUX"] ? `\x1bPtmux;\x1b${osc52}\x1b\\` : osc52
        // @ts-expect-error writeOut is not in type definitions
        renderer.writeOut(finalOsc52)

        await Clipboard.copy(text)
        toast.show({
          message: "Message copied to clipboard!",
          variant: "success"
        })
        return
      } catch (error) {
        toast.show({
          message: "Failed to copy message",
          variant: "error"
        })
        console.error("Error copying message:", error)
        return
      }
    }
  }

  // If no non-synthetic content found, try synthetic content as fallback
  // (Assistant messages often have synthetic text parts by design)
  const syntheticTextParts = parts.filter((part): part is TextPart =>
    part.type === "text" && part.synthetic === true
  )
  if (syntheticTextParts.length > 0) {
    const text = syntheticTextParts
      .map((part) => part.text)
      .join("\n")
      .trim()

    if (text) {
      try {
        // Copy to clipboard using existing clipboard functionality
        const base64 = Buffer.from(text).toString("base64")
        const osc52 = `\x1b]52;c;${base64}\x07`
        const finalOsc52 = process.env["TMUX"] ? `\x1bPtmux;\x1b${osc52}\x1b\\` : osc52
        // @ts-expect-error writeOut is not in type definitions
        renderer.writeOut(finalOsc52)

        await Clipboard.copy(text)
        toast.show({
          message: "Message copied to clipboard (synthetic content)!",
          variant: "success"
        })
        return
      } catch (error) {
        toast.show({
          message: "Failed to copy message",
          variant: "error"
        })
        console.error("Error copying message:", error)
        return
      }
    }
  }

  // If no text content, try to get other types of content
  // Try tool output
  const toolParts = parts.filter((part): part is ToolPart =>
    part.type === "tool" && part.state.status === "completed"
  )
  if (toolParts.length > 0) {
    // Only get output from completed tools
    const completedToolParts = toolParts.filter((part) =>
      part.state.status === "completed" && "output" in part.state && !!part.state.output
    )

    if (completedToolParts.length > 0) {
      const toolOutput = completedToolParts
        .map((part) => (part.state as any).output) // Safe cast since we've filtered for completed state
        .join("\n---\n")  // Separate multiple tool outputs
        .trim()

      if (toolOutput) {
        try {
          const base64 = Buffer.from(toolOutput).toString("base64")
          const osc52 = `\x1b]52;c;${base64}\x07`
          const finalOsc52 = process.env["TMUX"] ? `\x1bPtmux;\x1b${osc52}\x1b\\` : osc52
          // @ts-expect-error writeOut is not in type definitions
          renderer.writeOut(finalOsc52)

          await Clipboard.copy(toolOutput)
          toast.show({
            message: "Tool output copied to clipboard!",
            variant: "success"
          })
          return
        } catch (error) {
          toast.show({
            message: "Failed to copy tool output",
            variant: "error"
          })
          console.error("Error copying tool output:", error)
          return
        }
      }
    }
  }

  // Try reasoning content
  const reasoningParts = parts.filter((part): part is ReasoningPart =>
    part.type === "reasoning"
  )
  if (reasoningParts.length > 0) {
    const reasoningText = reasoningParts
      .map((part) => part.text)
      .join("\n")
      .trim()

    if (reasoningText) {
      try {
        const base64 = Buffer.from(reasoningText).toString("base64")
        const osc52 = `\x1b]52;c;${base64}\x07`
        const finalOsc52 = process.env["TMUX"] ? `\x1bPtmux;\x1b${osc52}\x1b\\` : osc52
        // @ts-expect-error writeOut is not in type definitions
        renderer.writeOut(finalOsc52)

        await Clipboard.copy(reasoningText)
        toast.show({
          message: "Reasoning content copied to clipboard!",
          variant: "success"
        })
        return
      } catch (error) {
        toast.show({
          message: "Failed to copy reasoning content",
          variant: "error"
        })
        console.error("Error copying reasoning content:", error)
        return
      }
    }
  }

  // If no copyable content found
  toast.show({
    message: "No copyable content found in message",
    variant: "error"
  })
}