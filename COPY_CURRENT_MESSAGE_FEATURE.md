# Copy Current Message Feature

## Overview

The "Copy Current Message" feature allows users to copy the currently visible message (either user or assistant) to the clipboard using the keyboard shortcut `Ctrl+Y`. This feature enhances the user experience by providing quick access to message content without manual selection.

## Implementation Details

### Components

1. **Keybind Configuration** (`config/config.ts`)
   - Added `messages_copy_current` keybind with default value `"ctrl+y"`
   - This keybind is registered in the session component's command registry

2. **Navigation Logic** (`cli/cmd/tui/vim/navigation.ts`)
   - Implemented `getCurrentMessage()` function that intelligently detects the message currently visible in the viewport
   - Handles both user messages (which have container elements with message IDs) and assistant messages (which consist of multiple part elements)
   - Uses multi-layer detection approach:
     - First checks for direct ID matches (user messages)
     - Then looks for part-based matches (assistant messages)
     - Falls back to proximity-based detection
     - Final fallback returns the most recent message

3. **Clipboard Functionality** (`cli/cmd/tui/vim/clipboard.ts`)
   - Implemented `copyMessageContent()` function that copies message content to clipboard
   - Prioritizes non-synthetic text content over synthetic content
   - Includes fallback mechanisms for different content types (tool output, reasoning content)
   - Provides appropriate user feedback via toast notifications

4. **Session Integration** (`cli/cmd/tui/routes/session/index.tsx`)
   - Registered "Copy current message" command in the session's command registry
   - Binds the command to the `messages_copy_current` keybind
   - Integrates with existing toast notification system for user feedback

## Key Improvements

Enhanced the `getCurrentMessage()` function with improved detection logic:

1. **Better Element Matching**
   - For user messages: Looks for container elements with IDs matching message IDs
   - For assistant messages: Looks for part elements with IDs following the pattern `text-{partId}`

2. **Multi-Layer Detection Approach**
   - Primary: Direct visible element matching - sorts visible elements by Y position and returns the **topmost** visible message
   - Secondary: Part-based element matching for assistant messages
   - Tertiary: Proximity-based detection using average element positions
   - Quaternary: Fallback to most recent message

3. **Robust Fallbacks**
   - Multiple detection strategies ensure a message is almost always found
   - Graceful degradation to most recent message as last resort

## Technical Highlights

### Message Structure Differences

- **User Messages**: Have a single container element with the message ID
- **Assistant Messages**: Consist of multiple part elements, each with IDs like `text-{partId}`

### Detection Strategy

The enhanced detection algorithm handles both message types by:

1. Checking visible elements for direct message ID matches
2. For unmatched elements, checking if they correspond to message parts
3. **Important Note**: The algorithm sorts visible elements by Y position (top to bottom) and returns the **topmost** visible message that matches, not necessarily the one closest to the viewport center
4. Calculating message positions based on their constituent elements (used as fallback when no direct matches are found)
5. Using proximity to viewport center for ranking (only used in fallback scenario)

### Clipboard Handling

The clipboard functionality supports multiple content types:

1. Non-synthetic text content (preferred)
2. Synthetic text content (fallback for assistant messages)
3. Tool output content
4. Reasoning content
5. Appropriate error handling and user feedback

## Testing Results

The feature has been tested and verified to work correctly for:

- User messages in viewport
- Assistant messages in viewport
- Messages partially visible in viewport
- Edge cases with no perfectly aligned messages
- **Note**: When multiple messages are visible in the viewport, the **topmost** message is selected for copying

## Future Improvements

Potential enhancements could include:

1. More sophisticated viewport intersection calculations
2. Better handling of messages with mixed content types
3. Configurable behavior for what constitutes "current" message
4. Enhanced feedback for different copy scenarios

## Conclusion

The copy current message feature is now robust and handles both user and assistant messages effectively. The multi-layer detection approach ensures that a relevant message is almost always found, significantly improving the user experience. The algorithm prioritizes the topmost visible message in the viewport, providing predictable and consistent behavior.