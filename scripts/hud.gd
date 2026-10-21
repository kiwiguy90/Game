extends CanvasLayer
## On-screen display: hearts, crystal count, timer, control hints, short
## "toast" notifications and a centred message panel for menus.

var _hearts_label: Label
var _crystals_label: Label
var _time_label: Label
var _toast_label: Label
var _message_panel: Control
var _message_title: Label
var _message_body: Label
var _toast_tween: Tween


func _ready() -> void:
	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)

	_hearts_label = _make_label(root, 30, Color(1.0, 0.45, 0.5))
	_hearts_label.position = Vector2(24, 16)

	_crystals_label = _make_label(root, 30, Color(0.45, 0.95, 1.0))
	_crystals_label.position = Vector2(24, 58)

	_time_label = _make_label(root, 30, Color.WHITE)
	_time_label.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	_time_label.offset_left = -240
	_time_label.offset_right = -24
	_time_label.offset_top = 16
	_time_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT

	var hint := _make_label(root, 18, Color(1, 1, 1, 0.75))
	hint.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	hint.offset_left = 24
	hint.offset_top = -44
	hint.text = "WASD move  ·  Mouse look  ·  Space jump  ·  Shift sprint  ·  Esc pause"

	_toast_label = _make_label(root, 34, Color(1.0, 0.95, 0.6))
	_toast_label.set_anchors_preset(Control.PRESET_CENTER_TOP)
	_toast_label.offset_left = -400
	_toast_label.offset_right = 400
	_toast_label.offset_top = 110
	_toast_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_toast_label.modulate.a = 0.0

	var center := CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	center.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(center)

	var panel := PanelContainer.new()
	panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.05, 0.07, 0.12, 0.85)
	style.set_corner_radius_all(16)
	style.set_content_margin_all(32)
	panel.add_theme_stylebox_override("panel", style)
	center.add_child(panel)
	_message_panel = panel

	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 16)
	panel.add_child(box)

	_message_title = _make_label(box, 48, Color(0.55, 0.95, 1.0))
	_message_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_message_body = _make_label(box, 22, Color.WHITE)
	_message_body.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER


func set_hearts(current: int, maximum: int) -> void:
	_hearts_label.text = "Hearts  %d / %d" % [current, maximum]


func set_crystals(current: int, total: int) -> void:
	_crystals_label.text = "Crystals  %d / %d" % [current, total]


func set_time(seconds: float) -> void:
	_time_label.text = format_time(seconds)


func toast(text: String) -> void:
	_toast_label.text = text
	if _toast_tween:
		_toast_tween.kill()
	_toast_label.modulate.a = 1.0
	_toast_tween = create_tween()
	_toast_tween.tween_interval(1.8)
	_toast_tween.tween_property(_toast_label, "modulate:a", 0.0, 0.6)


func show_message(title: String, body: String) -> void:
	_message_title.text = title
	_message_body.text = body
	_message_panel.visible = true


func hide_message() -> void:
	_message_panel.visible = false


static func format_time(seconds: float) -> String:
	return "%d:%05.2f" % [int(seconds) / 60, fmod(seconds, 60.0)]


func _make_label(parent: Control, size: int, color: Color) -> Label:
	var label := Label.new()
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	label.add_theme_font_size_override("font_size", size)
	label.add_theme_color_override("font_color", color)
	label.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.8))
	label.add_theme_constant_override("outline_size", 8)
	parent.add_child(label)
	return label
