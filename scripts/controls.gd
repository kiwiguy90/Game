extends RefCounted
## Registers the game's input actions at startup, so the project works
## out of the box with keyboard, mouse and gamepad without a hand-edited
## input map. Actions already defined in Project Settings are left alone.

const DEADZONE := 0.2


static func setup() -> void:
	_add("move_forward", [KEY_W, KEY_UP], [], [[JOY_AXIS_LEFT_Y, -1.0]])
	_add("move_back", [KEY_S, KEY_DOWN], [], [[JOY_AXIS_LEFT_Y, 1.0]])
	_add("move_left", [KEY_A, KEY_LEFT], [], [[JOY_AXIS_LEFT_X, -1.0]])
	_add("move_right", [KEY_D, KEY_RIGHT], [], [[JOY_AXIS_LEFT_X, 1.0]])
	_add("camera_left", [], [], [[JOY_AXIS_RIGHT_X, -1.0]])
	_add("camera_right", [], [], [[JOY_AXIS_RIGHT_X, 1.0]])
	_add("camera_up", [], [], [[JOY_AXIS_RIGHT_Y, -1.0]])
	_add("camera_down", [], [], [[JOY_AXIS_RIGHT_Y, 1.0]])
	_add("jump", [KEY_SPACE], [JOY_BUTTON_A], [])
	_add("sprint", [KEY_SHIFT], [JOY_BUTTON_B], [[JOY_AXIS_TRIGGER_RIGHT, 1.0]])
	_add("pause", [KEY_ESCAPE, KEY_P], [JOY_BUTTON_START], [])
	_add("restart", [KEY_R], [JOY_BUTTON_BACK], [])
	_add("confirm", [KEY_ENTER, KEY_KP_ENTER], [JOY_BUTTON_A, JOY_BUTTON_START], [])


static func _add(action: StringName, keys: Array, buttons: Array, axes: Array) -> void:
	if InputMap.has_action(action):
		return
	InputMap.add_action(action, DEADZONE)
	for key in keys:
		var key_event := InputEventKey.new()
		key_event.physical_keycode = key
		InputMap.action_add_event(action, key_event)
	for button in buttons:
		var button_event := InputEventJoypadButton.new()
		button_event.button_index = button
		InputMap.action_add_event(action, button_event)
	for axis in axes:
		var motion_event := InputEventJoypadMotion.new()
		motion_event.axis = axis[0]
		motion_event.axis_value = axis[1]
		InputMap.action_add_event(action, motion_event)
