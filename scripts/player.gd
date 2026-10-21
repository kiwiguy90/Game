extends CharacterBody3D
## The adventurer: camera-relative movement, sprinting, jumping with coyote
## time and jump buffering, an orbiting spring-arm camera, and knockback
## when hurt. Builds its own body, collision shape and camera in _ready().

signal damaged
signal fell

const WALK_SPEED := 6.0
const SPRINT_SPEED := 9.5
const GROUND_ACCEL := 45.0
const AIR_ACCEL := 14.0
const JUMP_VELOCITY := 8.5
const GRAVITY := 22.0
const COYOTE_TIME := 0.12
const JUMP_BUFFER_TIME := 0.12
const FALL_LIMIT := -20.0

const MOUSE_SENSITIVITY := 0.0025
const STICK_SENSITIVITY := 2.8
const MIN_PITCH := -1.2
const MAX_PITCH := 0.35
const CAMERA_DISTANCE := 5.5

const INVULNERABLE_TIME := 1.5
const KNOCKBACK_TIME := 0.35

var last_safe_position := Vector3.ZERO

var _camera_pivot: Node3D
var _spring_arm: SpringArm3D
var _model: Node3D
var _coyote_timer := 0.0
var _jump_buffer_timer := 0.0
var _invulnerable_timer := 0.0
var _knockback_timer := 0.0


func _ready() -> void:
	add_to_group("player")
	last_safe_position = global_position

	var collision := CollisionShape3D.new()
	var capsule := CapsuleShape3D.new()
	capsule.radius = 0.4
	capsule.height = 1.6
	collision.shape = capsule
	collision.position.y = 0.8
	add_child(collision)

	_model = _build_model()
	add_child(_model)

	_camera_pivot = Node3D.new()
	_camera_pivot.position.y = 1.4
	add_child(_camera_pivot)

	_spring_arm = SpringArm3D.new()
	_spring_arm.spring_length = CAMERA_DISTANCE
	_spring_arm.rotation.x = -0.35
	var probe := SphereShape3D.new()
	probe.radius = 0.25
	_spring_arm.shape = probe
	_spring_arm.add_excluded_object(get_rid())
	_camera_pivot.add_child(_spring_arm)

	var camera := Camera3D.new()
	camera.fov = 70.0
	camera.current = true
	_spring_arm.add_child(camera)


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		var motion := event as InputEventMouseMotion
		_camera_pivot.rotation.y -= motion.relative.x * MOUSE_SENSITIVITY
		_spring_arm.rotation.x = clampf(
			_spring_arm.rotation.x - motion.relative.y * MOUSE_SENSITIVITY, MIN_PITCH, MAX_PITCH)


func _physics_process(delta: float) -> void:
	var look := Input.get_vector("camera_left", "camera_right", "camera_up", "camera_down")
	_camera_pivot.rotation.y -= look.x * STICK_SENSITIVITY * delta
	_spring_arm.rotation.x = clampf(
		_spring_arm.rotation.x - look.y * STICK_SENSITIVITY * delta, MIN_PITCH, MAX_PITCH)

	# Gravity and jumping. Coyote time lets you jump just after walking off
	# a ledge; the jump buffer remembers a press made just before landing.
	if is_on_floor():
		_coyote_timer = COYOTE_TIME
	else:
		velocity.y -= GRAVITY * delta
		_coyote_timer -= delta

	if Input.is_action_just_pressed("jump"):
		_jump_buffer_timer = JUMP_BUFFER_TIME
	else:
		_jump_buffer_timer -= delta

	if _jump_buffer_timer > 0.0 and _coyote_timer > 0.0:
		velocity.y = JUMP_VELOCITY
		_jump_buffer_timer = 0.0
		_coyote_timer = 0.0
		_model.scale = Vector3(0.8, 1.25, 0.8)
	elif Input.is_action_just_released("jump") and velocity.y > 0.0:
		velocity.y *= 0.5 # Short hop when the button is tapped.

	# Horizontal movement relative to where the camera is looking.
	var input := Input.get_vector("move_left", "move_right", "move_forward", "move_back")
	var direction := _camera_pivot.global_transform.basis * Vector3(input.x, 0.0, input.y)
	direction.y = 0.0
	direction = direction.normalized() * input.length()

	var speed := SPRINT_SPEED if Input.is_action_pressed("sprint") else WALK_SPEED
	var accel := GROUND_ACCEL if is_on_floor() and _knockback_timer <= 0.0 else AIR_ACCEL
	var horizontal := Vector2(velocity.x, velocity.z).move_toward(
		Vector2(direction.x, direction.z) * speed, accel * delta)
	velocity.x = horizontal.x
	velocity.z = horizontal.y

	if direction.length() > 0.1:
		var target_yaw := atan2(-direction.x, -direction.z)
		_model.rotation.y = lerp_angle(_model.rotation.y, target_yaw, 12.0 * delta)

	var was_on_floor := is_on_floor()
	move_and_slide()
	if is_on_floor() and not was_on_floor:
		_model.scale = Vector3(1.25, 0.75, 1.25) # Landing squash.

	_model.scale = _model.scale.lerp(Vector3.ONE, 10.0 * delta)
	_knockback_timer -= delta
	_update_invulnerability(delta)
	_record_safe_ground()

	if global_position.y < FALL_LIMIT:
		fell.emit()


## Called by enemies. Returns false while still invulnerable from a recent hit.
func hurt(from: Vector3) -> bool:
	if _invulnerable_timer > 0.0:
		return false
	_invulnerable_timer = INVULNERABLE_TIME
	_knockback_timer = KNOCKBACK_TIME
	var away := global_position - from
	away.y = 0.0
	away = away.normalized() if away.length() > 0.01 else Vector3.BACK
	velocity = away * 9.0 + Vector3.UP * 6.0
	damaged.emit()
	return true


## Called after stomping an enemy.
func bounce() -> void:
	velocity.y = JUMP_VELOCITY * 0.85
	_model.scale = Vector3(0.8, 1.25, 0.8)


func respawn() -> void:
	global_position = last_safe_position
	velocity = Vector3.ZERO
	_invulnerable_timer = 1.0


func is_stomping(target_y: float) -> bool:
	return velocity.y < 0.0 and global_position.y > target_y


func _update_invulnerability(delta: float) -> void:
	if _invulnerable_timer > 0.0:
		_invulnerable_timer -= delta
		_model.visible = fmod(_invulnerable_timer, 0.2) > 0.1
	else:
		_model.visible = true


## Remembers the island the player last stood on, to respawn there after a fall.
func _record_safe_ground() -> void:
	if not is_on_floor():
		return
	for i in get_slide_collision_count():
		var node := get_slide_collision(i).get_collider() as Node
		if node and node.is_in_group("safe_ground"):
			last_safe_position = node.get_meta("spawn_point")
			return


func _build_model() -> Node3D:
	var model := Node3D.new()

	var body := MeshInstance3D.new()
	var body_mesh := CapsuleMesh.new()
	body_mesh.radius = 0.4
	body_mesh.height = 1.6
	body_mesh.material = _material(Color(0.95, 0.55, 0.2))
	body.mesh = body_mesh
	body.position.y = 0.8
	model.add_child(body)

	var hat := MeshInstance3D.new()
	var hat_mesh := CylinderMesh.new()
	hat_mesh.top_radius = 0.0
	hat_mesh.bottom_radius = 0.42
	hat_mesh.height = 0.5
	hat_mesh.material = _material(Color(0.2, 0.45, 0.85))
	hat.mesh = hat_mesh
	hat.position.y = 1.75
	model.add_child(hat)

	var eye_mesh := SphereMesh.new()
	eye_mesh.radius = 0.08
	eye_mesh.height = 0.16
	eye_mesh.material = _material(Color(0.05, 0.05, 0.08))
	for side in [-1.0, 1.0]:
		var eye := MeshInstance3D.new()
		eye.mesh = eye_mesh
		eye.position = Vector3(0.15 * side, 1.25, -0.36)
		model.add_child(eye)

	var pack := MeshInstance3D.new()
	var pack_mesh := BoxMesh.new()
	pack_mesh.size = Vector3(0.5, 0.55, 0.25)
	pack_mesh.material = _material(Color(0.45, 0.3, 0.18))
	pack.mesh = pack_mesh
	pack.position = Vector3(0.0, 0.95, 0.4)
	model.add_child(pack)

	return model


func _material(color: Color) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = 0.7
	return material
