extends Area3D
## The exit portal. Stays dormant until activate() is called, then emits
## `entered` when the player walks into it.

signal entered

var active := false

var _ring_material: StandardMaterial3D
var _disc_material: StandardMaterial3D
var _disc: MeshInstance3D
var _light: OmniLight3D
var _label: Label3D
var _time := 0.0


func _ready() -> void:
	var collision := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(2.4, 3.0, 1.0)
	collision.shape = box
	collision.position.y = 1.6
	add_child(collision)

	var base := MeshInstance3D.new()
	var base_mesh := BoxMesh.new()
	base_mesh.size = Vector3(3.4, 0.3, 1.4)
	var stone := StandardMaterial3D.new()
	stone.albedo_color = Color(0.45, 0.45, 0.5)
	base_mesh.material = stone
	base.mesh = base_mesh
	base.position.y = 0.15
	add_child(base)

	_ring_material = StandardMaterial3D.new()
	_ring_material.emission_enabled = true
	var ring := MeshInstance3D.new()
	var torus := TorusMesh.new()
	torus.inner_radius = 1.15
	torus.outer_radius = 1.45
	torus.material = _ring_material
	ring.mesh = torus
	ring.position.y = 1.75
	ring.rotation.x = PI / 2.0
	add_child(ring)

	_disc_material = StandardMaterial3D.new()
	_disc_material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	_disc_material.emission_enabled = true
	_disc_material.cull_mode = BaseMaterial3D.CULL_DISABLED
	_disc = MeshInstance3D.new()
	var disc_mesh := CylinderMesh.new()
	disc_mesh.top_radius = 1.15
	disc_mesh.bottom_radius = 1.15
	disc_mesh.height = 0.04
	disc_mesh.material = _disc_material
	_disc.mesh = disc_mesh
	_disc.position.y = 1.75
	_disc.rotation.x = PI / 2.0
	add_child(_disc)

	_light = OmniLight3D.new()
	_light.position.y = 1.75
	_light.omni_range = 6.0
	add_child(_light)

	_label = Label3D.new()
	_label.position.y = 4.0
	_label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	_label.font_size = 48
	_label.outline_size = 12
	_label.pixel_size = 0.02
	add_child(_label)

	_apply_look()
	body_entered.connect(_on_body_entered)


func activate() -> void:
	active = true
	_apply_look()


func _process(delta: float) -> void:
	_time += delta
	if active:
		_disc.rotation.y += delta
		_disc_material.emission_energy_multiplier = 1.5 + sin(_time * 3.0) * 0.5


func _apply_look() -> void:
	var color := Color(0.75, 0.35, 1.0) if active else Color(0.35, 0.35, 0.4)
	_ring_material.albedo_color = color
	_ring_material.emission = color
	_ring_material.emission_energy_multiplier = 2.0 if active else 0.0
	_disc_material.albedo_color = Color(color, 0.7 if active else 0.15)
	_disc_material.emission = color
	_disc_material.emission_energy_multiplier = 1.5 if active else 0.0
	_light.light_color = color
	_light.light_energy = 2.0 if active else 0.0
	_label.text = "Step inside!" if active else "Sealed: collect every crystal"
	_label.modulate = Color(1.0, 0.9, 1.0) if active else Color(0.8, 0.8, 0.85)


func _on_body_entered(body: Node3D) -> void:
	if active and body.is_in_group("player"):
		entered.emit()
