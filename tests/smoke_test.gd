extends SceneTree
## Headless smoke test. Loads the main scene, then checks that falling costs
## a heart and respawns the player, that an enemy hurts, that every crystal
## can be collected, and that the portal ends the game once it opens.
##
## Run from the project folder:
##   godot --headless --path . -s res://tests/smoke_test.gd

const Crystal := preload("res://scripts/crystal.gd")

var _failures := 0


func _initialize() -> void:
	_run()


func _run() -> void:
	var main: Node = load("res://scenes/main.tscn").instantiate()
	root.add_child(main)
	await _frames(2)

	_check(main.state == main.State.INTRO, "starts on the intro screen")
	_check(paused, "world is paused on the intro screen")
	main._set_state(main.State.PLAYING)
	_check(not paused, "world runs while playing")

	var player: CharacterBody3D = main.player
	await _frames(30)
	_check(player.is_on_floor(), "player lands on the starting island")

	# Falling into the sea.
	player.global_position = Vector3(0, -30, 60)
	await _frames(3)
	_check(main.hearts == main.MAX_HEARTS - 1, "falling costs a heart")
	_check(player.global_position.y > -1.0, "player respawns after falling")

	# Touching an enemy from the side.
	await _frames(70) # Let respawn invulnerability wear off.
	var enemy: Area3D = _find(main.world, func(n: Node) -> bool: return n.has_method("_defeat"))
	player.global_position = enemy.global_position - Vector3(0, 0.6, 0)
	player.velocity = Vector3.ZERO
	await _frames(3)
	_check(main.hearts == main.MAX_HEARTS - 2, "touching an enemy costs a heart")

	# Stomping an enemy from above.
	await _frames(100)
	player.global_position = enemy.global_position + Vector3(0, 0.5, 0)
	player.velocity = Vector3(0, -3, 0)
	await _frames(3)
	_check(main.hearts == main.MAX_HEARTS - 2, "stomping does not cost a heart")
	_check(player.velocity.y > 0.0, "stomping bounces the player")
	await _frames(30)
	_check(not is_instance_valid(enemy), "stomped enemy is defeated")

	# Riding the moving platform.
	var platform: Node3D = _find(main.world, func(n: Node) -> bool: return n is AnimatableBody3D)
	var start_x := platform.global_position.x
	player.global_position = platform.global_position + Vector3(0, 0.5, 0)
	player.velocity = Vector3.ZERO
	await _frames(150)
	_check(player.is_on_floor(), "player stays on the moving platform")
	_check(absf(player.global_position.x - platform.global_position.x) < 1.0
		and absf(platform.global_position.x - start_x) > 2.0, "moving platform carries the player")

	# Collect every crystal.
	var crystals: Array[Node] = []
	for node in main.world.get_children():
		if node.get_script() == Crystal:
			crystals.append(node)
	_check(crystals.size() == main.crystals_total and crystals.size() > 0, "crystals were placed")
	_check(not main.portal.active, "portal starts sealed")
	for crystal in crystals:
		player.global_position = crystal.global_position - Vector3(0, 0.8, 0)
		player.velocity = Vector3.ZERO
		await _frames(3)
	_check(main.crystals_collected == main.crystals_total,
		"collected %d / %d crystals" % [main.crystals_collected, main.crystals_total])
	_check(main.portal.active, "portal opens after the last crystal")

	# Step into the portal.
	player.global_position = main.portal.global_position + Vector3(0, 0.5, 0)
	player.velocity = Vector3.ZERO
	await _frames(3)
	_check(main.state == main.State.WON, "entering the portal wins the game")

	if _failures == 0:
		print("SMOKE TEST PASSED")
	else:
		printerr("SMOKE TEST FAILED (%d checks)" % _failures)
	quit(1 if _failures else 0)


func _frames(count: int) -> void:
	for i in count:
		await physics_frame


func _find(node: Node, predicate: Callable) -> Node:
	for child in node.get_children():
		if predicate.call(child):
			return child
	return null


func _check(condition: bool, description: String) -> void:
	if condition:
		print("  ok    ", description)
	else:
		_failures += 1
		printerr("  FAIL  ", description)
