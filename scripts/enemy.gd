extends Area3D
## A slime that patrols back and forth between two points. Touching it costs
## a heart; landing on top of it defeats it and bounces the player up.

@export var point_a := Vector3.ZERO
@export var point_b := Vector3.ZERO
@export var speed := 2.5

const RADIUS := 0.6

var _blob: MeshInstance3D
var _progress := 0.0
var _time := 0.0
var _defeated := false


func _ready() -> void:
	position = point_a

	var collision := CollisionShape3D.new()
	var sphere := SphereShape3D.new()
	sphere.radius = RADIUS
	collision.shape = sphere
	add_child(collision)

	_blob = MeshInstance3D.new()
	var blob_mesh := SphereMesh.new()
	blob_mesh.radius = RADIUS
	blob_mesh.height = RADIUS * 1.7
	var material := StandardMaterial3D.new()
	material.albedo_color = Color(0.6, 0.2, 0.75)
	material.roughness = 0.25
	blob_mesh.material = material
	_blob.mesh = blob_mesh
	add_child(_blob)

	var eye_mesh := SphereMesh.new()
	eye_mesh.radius = 0.12
	eye_mesh.height = 0.24
	var eye_material := StandardMaterial3D.new()
	eye_material.albedo_color = Color(1.0, 0.95, 0.4)
	eye_material.emission_enabled = true
	eye_material.emission = Color(1.0, 0.85, 0.2)
	eye_mesh.material = eye_material
	for side in [-1.0, 1.0]:
		var eye := MeshInstance3D.new()
		eye.mesh = eye_mesh
		eye.position = Vector3(0.2 * side, 0.15, -0.48)
		_blob.add_child(eye)

	body_entered.connect(_on_body_entered)


func _physics_process(delta: float) -> void:
	if _defeated:
		return
	_time += delta
	var distance := point_a.distance_to(point_b)
	if distance > 0.01:
		_progress += delta * speed / distance
		var t := pingpong(_progress, 1.0)
		position = point_a.lerp(point_b, smoothstep(0.0, 1.0, t))
		var heading := (point_b - point_a) * (1.0 if fmod(_progress, 2.0) < 1.0 else -1.0)
		_blob.rotation.y = lerp_angle(_blob.rotation.y, atan2(-heading.x, -heading.z), 8.0 * delta)
	var wobble := sin(_time * 8.0) * 0.08
	_blob.scale = Vector3(1.0 + wobble, 1.0 - wobble, 1.0 + wobble)


func _on_body_entered(body: Node3D) -> void:
	if _defeated or not body.is_in_group("player"):
		return
	if body.is_stomping(global_position.y + 0.2):
		body.bounce()
		_defeat()
	else:
		body.hurt(global_position)


func _defeat() -> void:
	_defeated = true
	set_deferred("monitoring", false)
	var tween := create_tween()
	tween.tween_property(_blob, "scale", Vector3(1.6, 0.1, 1.6), 0.15)
	tween.tween_property(_blob, "scale", Vector3.ZERO, 0.2)
	tween.tween_callback(queue_free)
