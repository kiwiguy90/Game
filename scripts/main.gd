extends Node3D
## Game controller. Builds the world (sky, islands, crystals, enemies and the
## portal), tracks hearts, crystals and time, and switches between the
## intro / playing / paused / won / lost states.
##
## The level is laid out in _build_level(): every position there is the
## centre of a surface's *top*, so it's easy to line platforms up.

const Controls := preload("res://scripts/controls.gd")
const Player := preload("res://scripts/player.gd")
const Crystal := preload("res://scripts/crystal.gd")
const Enemy := preload("res://scripts/enemy.gd")
const Portal := preload("res://scripts/portal.gd")
const Hud := preload("res://scripts/hud.gd")

enum State { INTRO, PLAYING, PAUSED, WON, LOST }

const MAX_HEARTS := 3
const PLAYER_START := Vector3(0, 0.1, 4)

const GRASS := Color(0.36, 0.7, 0.32)
const DIRT := Color(0.47, 0.33, 0.22)
const STONE := Color(0.58, 0.58, 0.62)
const WOOD := Color(0.6, 0.42, 0.25)

var state := State.INTRO
var hearts := MAX_HEARTS
var crystals_total := 0
var crystals_collected := 0
var elapsed := 0.0

var world: Node3D
var player: Player
var portal: Portal
var hud: Hud


func _enter_tree() -> void:
	Controls.setup()


func _ready() -> void:
	# The controller and HUD keep running while paused; the world does not.
	process_mode = Node.PROCESS_MODE_ALWAYS
	world = Node3D.new()
	world.name = "World"
	world.process_mode = Node.PROCESS_MODE_PAUSABLE
	add_child(world)

	hud = Hud.new()
	add_child(hud)

	_build_environment()
	_build_level()

	player = Player.new()
	player.position = PLAYER_START
	world.add_child(player)
	player.damaged.connect(_on_player_damaged)
	player.fell.connect(_on_player_fell)

	hud.set_hearts(hearts, MAX_HEARTS)
	hud.set_crystals(crystals_collected, crystals_total)
	hud.set_time(elapsed)
	_set_state(State.INTRO)


func _process(delta: float) -> void:
	if state == State.PLAYING:
		elapsed += delta
		hud.set_time(elapsed)


func _unhandled_input(event: InputEvent) -> void:
	var clicked: bool = event is InputEventMouseButton and event.pressed
	match state:
		State.INTRO, State.PAUSED:
			if clicked or event.is_action_pressed("confirm") or event.is_action_pressed("pause"):
				_set_state(State.PLAYING)
				get_viewport().set_input_as_handled()
			elif state == State.PAUSED and event.is_action_pressed("restart"):
				_restart()
		State.PLAYING:
			if event.is_action_pressed("pause"):
				_set_state(State.PAUSED)
				get_viewport().set_input_as_handled()
			elif clicked and Input.mouse_mode != Input.MOUSE_MODE_CAPTURED:
				Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
		State.WON, State.LOST:
			if event.is_action_pressed("restart") or event.is_action_pressed("confirm"):
				_restart()


func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_FOCUS_OUT and state == State.PLAYING:
		_set_state(State.PAUSED)


func _set_state(new_state: State) -> void:
	state = new_state
	var playing := state == State.PLAYING
	get_tree().paused = not playing
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED if playing else Input.MOUSE_MODE_VISIBLE
	match state:
		State.INTRO:
			hud.show_message("Crystal Isles",
				"Collect all %d crystals scattered across the floating isles,\n" % crystals_total
				+ "then escape through the portal on the western isle.\n"
				+ "Stomp on slimes, and don't fall into the sea!\n\n"
				+ "WASD / left stick: move     Mouse / right stick: camera\n"
				+ "Space / A: jump     Shift / B: sprint     Esc / Start: pause\n\n"
				+ "Click or press Enter to begin")
		State.PLAYING:
			hud.hide_message()
		State.PAUSED:
			hud.show_message("Paused", "Click or press Enter to resume\nPress R to restart")
		State.WON:
			hud.show_message("You escaped!",
				"All %d crystals in %s with %d %s left.\n\nPress R or Enter to play again"
				% [crystals_total, Hud.format_time(elapsed), hearts, "heart" if hearts == 1 else "hearts"])
		State.LOST:
			hud.show_message("Out of hearts",
				"You found %d of %d crystals.\n\nPress R or Enter to try again"
				% [crystals_collected, crystals_total])


func _restart() -> void:
	get_tree().paused = false
	get_tree().reload_current_scene()


func _lose_heart() -> void:
	hearts -= 1
	hud.set_hearts(hearts, MAX_HEARTS)
	if hearts <= 0:
		_set_state(State.LOST)


func _on_player_damaged() -> void:
	_lose_heart()
	if state == State.PLAYING:
		hud.toast("Ouch!")


func _on_player_fell() -> void:
	_lose_heart()
	if state == State.PLAYING:
		player.respawn()
		hud.toast("Splash! Back to the last island")


func _on_crystal_collected() -> void:
	crystals_collected += 1
	hud.set_crystals(crystals_collected, crystals_total)
	if crystals_collected == crystals_total:
		portal.activate()
		hud.toast("The portal is open! Head to the western isle")
	else:
		hud.toast("Crystal!  %d to go" % (crystals_total - crystals_collected))


func _on_portal_entered() -> void:
	if state == State.PLAYING:
		_set_state(State.WON)


# --- World building ---------------------------------------------------------

func _build_environment() -> void:
	var sky_material := ProceduralSkyMaterial.new()
	sky_material.sky_top_color = Color(0.25, 0.5, 0.9)
	sky_material.sky_horizon_color = Color(0.7, 0.82, 0.95)
	sky_material.ground_horizon_color = Color(0.7, 0.82, 0.95)
	sky_material.ground_bottom_color = Color(0.15, 0.3, 0.5)
	var sky := Sky.new()
	sky.sky_material = sky_material

	var environment := Environment.new()
	environment.background_mode = Environment.BG_SKY
	environment.sky = sky
	environment.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	environment.ambient_light_sky_contribution = 0.6
	environment.ambient_light_energy = 0.6
	environment.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	environment.glow_enabled = true
	environment.glow_hdr_threshold = 1.2
	environment.fog_enabled = true
	environment.fog_light_color = Color(0.7, 0.8, 0.92)
	environment.fog_density = 0.004
	var world_environment := WorldEnvironment.new()
	world_environment.environment = environment
	add_child(world_environment)

	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-55, -35, 0)
	sun.light_energy = 1.1
	sun.shadow_enabled = true
	sun.directional_shadow_max_distance = 80.0
	add_child(sun)

	# The sea far below. Falling past the player's FALL_LIMIT respawns them
	# before they reach it.
	var sea := MeshInstance3D.new()
	var plane := PlaneMesh.new()
	plane.size = Vector2(800, 800)
	var water := StandardMaterial3D.new()
	water.albedo_color = Color(0.1, 0.35, 0.6)
	water.metallic = 0.4
	water.roughness = 0.2
	plane.material = water
	sea.mesh = plane
	sea.position.y = -26
	world.add_child(sea)


func _build_level() -> void:
	# Starting meadow, with a climb of pillars hiding a crystal.
	_add_island(Vector3(0, 0, 0), Vector3(20, 2, 20))
	_add_crystal(Vector3(5, 1, 6))
	_add_block(Vector3(-5, 1, 5), Vector3(2, 1, 2), STONE)
	_add_block(Vector3(-7.5, 2, 7), Vector3(2, 2, 2), STONE)
	_add_block(Vector3(-5, 3, 9), Vector3(2, 3, 2), STONE)
	_add_crystal(Vector3(-5, 4, 9))
	for spot in [Vector3(7, 0, -6), Vector3(-7, 0, -5), Vector3(8, 0, 7)]:
		_add_tree(spot)

	# North: floating stepping stones up to the slime meadow.
	_add_block(Vector3(0, 0.5, -14), Vector3(3, 1, 3), STONE)
	_add_block(Vector3(2.5, 1.5, -18.5), Vector3(3, 1, 3), STONE)
	_add_block(Vector3(0, 2.5, -23), Vector3(3, 1, 3), STONE)
	_add_block(Vector3(-1, 2.75, -26.5), Vector3(3, 1, 3), STONE)
	_add_crystal(Vector3(0, 3.5, -23))

	_add_island(Vector3(0, 3, -36), Vector3(14, 2, 14))
	_add_crystal(Vector3(-4, 4, -32))
	_add_crystal(Vector3(4, 4, -40))
	_add_enemy(Vector3(-4, 3, -39), Vector3(4, 3, -39))
	for spot in [Vector3(-5, 3, -41), Vector3(5, 3, -31)]:
		_add_tree(spot)

	# East: ride the moving platform to the tower isle.
	_add_moving_platform(Vector3(9, 3, -36), Vector3(21, 3, -36), Vector3(4, 0.5, 4), 3.5)
	_add_crystal(Vector3(15, 4.2, -36))

	_add_island(Vector3(30, 4, -36), Vector3(12, 2, 12))
	_add_crystal(Vector3(27, 5, -32))
	_add_enemy(Vector3(26.5, 4, -36), Vector3(26.5, 4, -40.5))
	_add_block(Vector3(33, 5, -33), Vector3(2.5, 1, 2.5), STONE)
	_add_block(Vector3(33, 6, -36.5), Vector3(2.5, 2, 2.5), STONE)
	_add_block(Vector3(33, 7, -40), Vector3(2.5, 3, 2.5), STONE)
	_add_block(Vector3(29.5, 8, -40), Vector3(2.5, 4, 2.5), STONE)
	_add_crystal(Vector3(29.5, 9, -40))
	_add_tree(Vector3(25.5, 4, -31))

	# West: a plank bridge to the portal isle.
	for i in 4:
		_add_block(Vector3(-12.5 - 3 * i, 0.2 + 0.2 * i, 0), Vector3(2, 0.4, 2), WOOD)
	_add_crystal(Vector3(-17, 1.6, 0))

	_add_island(Vector3(-30, 1, 0), Vector3(14, 2, 14))
	_add_crystal(Vector3(-31, 2, 5))
	_add_enemy(Vector3(-26, 1, -4.5), Vector3(-26, 1, 4.5))
	for spot in [Vector3(-35, 1, -5), Vector3(-34, 1, 5.5), Vector3(-24.5, 1, 5.5)]:
		_add_tree(spot)

	portal = Portal.new()
	portal.position = Vector3(-35, 1, 0)
	portal.rotation.y = PI / 2.0 # Face the bridge.
	world.add_child(portal)
	portal.entered.connect(_on_portal_entered)


## A grassy island. Players respawn on the last island they stood on.
func _add_island(top: Vector3, size: Vector3) -> void:
	var body := _add_block(top, size, DIRT)
	body.add_to_group("safe_ground")
	body.set_meta("spawn_point", top + Vector3.UP * 0.5)
	var grass := MeshInstance3D.new()
	var grass_mesh := BoxMesh.new()
	grass_mesh.size = Vector3(size.x + 0.2, 0.3, size.z + 0.2)
	grass_mesh.material = _material(GRASS)
	grass.mesh = grass_mesh
	grass.position.y = size.y / 2.0 - 0.1
	body.add_child(grass)


## A solid box whose top surface is centred on `top`.
func _add_block(top: Vector3, size: Vector3, color: Color) -> StaticBody3D:
	var body := StaticBody3D.new()
	body.position = top - Vector3(0, size.y / 2.0, 0)
	_add_box_visual_and_shape(body, size, color)
	world.add_child(body)
	return body


func _add_moving_platform(from_top: Vector3, to_top: Vector3, size: Vector3, duration: float) -> void:
	var offset := Vector3(0, size.y / 2.0, 0)
	var body := AnimatableBody3D.new()
	body.position = from_top - offset
	_add_box_visual_and_shape(body, size, WOOD)
	world.add_child(body)
	var tween := body.create_tween().set_loops()
	tween.set_process_mode(Tween.TWEEN_PROCESS_PHYSICS)
	tween.set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	tween.tween_interval(0.8)
	tween.tween_property(body, "position", to_top - offset, duration)
	tween.tween_interval(0.8)
	tween.tween_property(body, "position", from_top - offset, duration)


func _add_box_visual_and_shape(body: CollisionObject3D, size: Vector3, color: Color) -> void:
	var mesh := MeshInstance3D.new()
	var box := BoxMesh.new()
	box.size = size
	box.material = _material(color)
	mesh.mesh = box
	body.add_child(mesh)
	var collision := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = size
	collision.shape = shape
	body.add_child(collision)


func _add_tree(ground: Vector3) -> void:
	var tree := StaticBody3D.new()
	tree.position = ground
	var trunk := MeshInstance3D.new()
	var trunk_mesh := CylinderMesh.new()
	trunk_mesh.top_radius = 0.2
	trunk_mesh.bottom_radius = 0.3
	trunk_mesh.height = 2.0
	trunk_mesh.material = _material(Color(0.4, 0.27, 0.15))
	trunk.mesh = trunk_mesh
	trunk.position.y = 1.0
	tree.add_child(trunk)
	var leaves := MeshInstance3D.new()
	var leaves_mesh := CylinderMesh.new()
	leaves_mesh.top_radius = 0.0
	leaves_mesh.bottom_radius = 1.3
	leaves_mesh.height = 2.8
	leaves_mesh.material = _material(Color(0.2, 0.5, 0.25))
	leaves.mesh = leaves_mesh
	leaves.position.y = 3.2
	tree.add_child(leaves)
	var collision := CollisionShape3D.new()
	var shape := CylinderShape3D.new()
	shape.radius = 0.35
	shape.height = 2.0
	collision.shape = shape
	collision.position.y = 1.0
	tree.add_child(collision)
	world.add_child(tree)


func _add_crystal(at: Vector3) -> void:
	var crystal := Crystal.new()
	crystal.position = at
	world.add_child(crystal)
	crystal.collected.connect(_on_crystal_collected)
	crystals_total += 1


## A slime patrolling between two ground points.
func _add_enemy(from_ground: Vector3, to_ground: Vector3) -> void:
	var enemy := Enemy.new()
	var lift := Vector3.UP * Enemy.RADIUS
	enemy.point_a = from_ground + lift
	enemy.point_b = to_ground + lift
	world.add_child(enemy)


func _material(color: Color) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = 0.85
	return material
