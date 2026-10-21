extends Area3D
## A spinning, glowing crystal. Emits `collected` once when the player touches it.

signal collected

var _gem: Node3D
var _time := randf() * TAU
var _taken := false


func _ready() -> void:
	var collision := CollisionShape3D.new()
	var sphere := SphereShape3D.new()
	sphere.radius = 0.6
	collision.shape = sphere
	add_child(collision)

	var material := StandardMaterial3D.new()
	material.albedo_color = Color(0.35, 0.95, 1.0)
	material.emission_enabled = true
	material.emission = Color(0.2, 0.8, 1.0)
	material.emission_energy_multiplier = 1.6
	material.metallic = 0.3
	material.roughness = 0.15

	# Two square pyramids base-to-base make an octahedron.
	_gem = Node3D.new()
	add_child(_gem)
	for flip in [1.0, -1.0]:
		var half := MeshInstance3D.new()
		var pyramid := CylinderMesh.new()
		pyramid.top_radius = 0.0
		pyramid.bottom_radius = 0.32
		pyramid.height = 0.45
		pyramid.radial_segments = 4
		pyramid.rings = 1
		pyramid.material = material
		half.mesh = pyramid
		half.position.y = 0.225 * flip
		half.scale.y = flip
		_gem.add_child(half)

	var light := OmniLight3D.new()
	light.light_color = Color(0.3, 0.85, 1.0)
	light.light_energy = 0.8
	light.omni_range = 3.0
	add_child(light)

	body_entered.connect(_on_body_entered)


func _process(delta: float) -> void:
	_time += delta
	_gem.rotation.y += 2.0 * delta
	if not _taken:
		_gem.position.y = sin(_time * 2.5) * 0.15


func _on_body_entered(body: Node3D) -> void:
	if _taken or not body.is_in_group("player"):
		return
	_taken = true
	set_deferred("monitoring", false)
	collected.emit()
	var tween := create_tween().set_parallel()
	tween.tween_property(_gem, "position:y", 1.5, 0.35)
	tween.tween_property(_gem, "scale", Vector3.ZERO, 0.35)
	tween.chain().tween_callback(queue_free)
