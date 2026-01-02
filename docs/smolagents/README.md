# Smolagents CUA2 Porting Notes (No E2B)

This folder captures the **prompt style**, **tool set**, and **UI patterns** from
`smolagents/computer-use-agent` so we can reuse the parts that fit Kronos **without E2B**.

## Source Files (frozen copies)
- `prompt.py` – system prompt template and step format
- `desktop_agent.py` – tool definitions and normalized coordinate logic
- `function_parser.py` – strict function-call parser
- `pregenerated_instructions.json` – reusable instruction templates
- `ui/` – UI reference components (connection status, sandbox viewer, completion view)

## Prompt Style Highlights (from `prompt.py`)
- **One action per step** with a strict structure:
  - Short term goal
  - What I see
  - Reflection
  - **Action** in a fenced code block
- **Always analyze the latest screenshot** before any action.
- **Normalized coordinates 0–1000** for x/y (converted to pixels).
- **Open URLs and launch apps via tools** (`open_url`, `launch`) instead of manual clicks.
- Emphasizes lightweight desktop assumptions (XFCE/Xubuntu + minimal apps).

### Why this matters for Kronos
Kronos currently uses **pixel coordinates** and **multi-tool** actions per turn.
To port the smolagents style **without E2B**, we should:
1. Add a **"single-action" parsing mode** (one tool call per assistant message).
2. Optionally add a **normalized coordinate mode** for models trained on 0–1000.
3. Keep the existing tool set but require a **session_id** (already enforced).

## Tool Set (from `desktop_agent.py`)
Defined tools:
- `click(x, y)`
- `right_click(x, y)`
- `double_click(x, y)`
- `move_mouse(x, y)`
- `write(text)`
- `press(keys)`
- `go_back()`
- `drag(x1, y1, x2, y2)`
- `scroll(x, y, direction="down", amount=2)`
- `wait(seconds)`
- `open_url(url)`
- `launch(app)`

### Suggested mapping to Bytebot tools
- `click` -> `computer_click_mouse` (button=left)
- `right_click` -> `computer_click_mouse` (button=right)
- `double_click` -> `computer_click_mouse` (clickCount=2)
- `move_mouse` -> `computer_move_mouse`
- `write` -> `computer_type_text` / `computer_paste_text`
- `press` -> `computer_type_keys`
- `go_back` -> `computer_type_keys` (Alt+Left) or browser UI
- `drag` -> `computer_drag_mouse` (path)
- `scroll` -> `computer_scroll`
- `wait` -> `computer_wait`
- `open_url` -> `computer_application` + typing URL in browser
- `launch` -> `computer_application`

## UI Patterns to Consider (from `cua2-front`)
- **ConnectionStatus**: explicit session connection indicator.
- **ProcessingIndicator**: step-based progress UI.
- **SandboxViewer**: full-screen desktop with overlay state.
- **CompletionView**: renders an action timeline + downloadable traces.

These can be translated into optional panels inside `/desktop` without changing core UI.

## Next Integration Steps (No E2B)
1. **Add “smolagents mode” to Bytebot prompts**:
   - Enforce one tool call per turn.
   - Short-term goal + reflection scaffold.
2. **Add coordinate normalization mode** (0–1000 → pixels).
3. **Add action trace recording**:
   - Log action + screenshot each step.
   - Enable a “Download JSON/GIF” button like `CompletionView`.

## Status
- Prompt + tool definitions have been captured.
- UI references saved for design review.
- Ready to implement the “smolagents mode” without E2B.
