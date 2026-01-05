# feat: Add copy current message command with improved algorithm

## Summary

This feature adds a "Copy Current Message" command that allows users to copy the currently visible message (either user or assistant) to the clipboard using the keyboard shortcut `Ctrl+Y`.

## Implementation

### Key Changes

1. **Navigation Logic** (`cli/cmd/tui/vim/navigation.ts`):
   - Implemented `getCurrentMessage()` function that intelligently detects the message currently visible in the viewport
   - Handles both user messages (which have container elements with message IDs) and assistant messages (which consist of multiple part elements)
   - Uses multi-layer detection approach with robust fallbacks
   - **Note**: The algorithm sorts visible elements by Y position (top to bottom) and returns the **topmost** visible message that matches, not necessarily the one closest to the viewport center

2. **Clipboard Functionality** (`cli/cmd/tui/vim/clipboard.ts`):
   - Implemented `copyMessageContent()` function that copies message content to clipboard
   - Supports multiple content types (non-synthetic text, synthetic text, tool output, reasoning content)
   - Provides appropriate user feedback via toast notifications

3. **Keybind Configuration** (`config/config.ts`):
   - Added `messages_copy_current` keybind with default value `"ctrl+y"`

4. **Session Integration** (`cli/cmd/tui/routes/session/index.tsx`):
   - Registered "Copy current message" command in the session's command registry
   - Binds the command to the `messages_copy_current` keybind

### Multi-Layer Detection Approach

1. **Direct ID Matching**: Check visible elements for direct message ID matches (user messages) - returns the **topmost** match
2. **Part-Based Matching**: Look for elements with IDs matching assistant message part patterns - returns the **topmost** match
3. **Proximity-Based Detection**: Calculate message positions based on constituent elements (fallback when no direct matches)
4. **Fallback Strategy**: Return the most recent message as last resort

## Technical Details

The implementation handles the different structure of user vs assistant messages:
- User messages have container elements with IDs matching their message IDs
- Assistant messages consist of multiple part elements with different ID patterns (e.g., `text-{partId}`)

## Testing Results

The feature works correctly for:
- User messages in viewport
- Assistant messages in viewport
- Messages partially visible in viewport
- Edge cases with various viewport alignments
- **Note**: When multiple messages are visible in the viewport, the **topmost** message is selected for copying

## Keybind

Uses `messages_copy_current` keybind (Ctrl+Y by default)