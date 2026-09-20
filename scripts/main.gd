extends Node2D

const ROOM_SIZE := Vector2(360.0, 640.0)
const PLAYER_SPEED := 150.0
const ATTACK_COOLDOWN := 0.32
const ATTACK_TIME := 0.16
const PLAYER_MAX_HP := 5
const GOLD_PER_KILL := 1

var room_cleared: bool = false
var player_pos := Vector2(180, 525)
var player_hp: int = PLAYER_MAX_HP
var gold: int = 0
var xp: int = 0
var level: int = 1
var attack_timer: float = 0.0
var attack_visual_timer: float = 0.0
var flash_timer: float = 0.0
var toast_timer: float = 0.0
var toast_text: String = ""
var next_room_timer: float = 0.0
var next_room_number: int = 2
var touch_move := Vector2.ZERO
var attack_touch := false
var enemies: Array[Dictionary] = []
var pickups: Array[Dictionary] = []
var rng := RandomNumberGenerator.new()

var room_closed: Texture2D
var room_open: Texture2D
var player_tex: Texture2D
var goblin_tex: Texture2D
var bat_tex: Texture2D
var gold_tex: Texture2D
var slash_tex: Texture2D
var hit_tex: Texture2D

func _ready() -> void:
    rng.seed = 404
    room_closed = load("res://assets/room_closed.png")
    room_open = load("res://assets/room_open.png")
    player_tex = load("res://assets/player_sheet.png")
    goblin_tex = load("res://assets/goblin_archer_sheet.png")
    bat_tex = load("res://assets/bat_sheet.png")
    gold_tex = load("res://assets/gold.png")
    slash_tex = load("res://assets/slash_fx.png")
    hit_tex = load("res://assets/hit_fx.png")
    _start_room()
    queue_redraw()

func _start_room() -> void:
    room_cleared = false
    player_pos = Vector2(180, 525)
    player_hp = PLAYER_MAX_HP
    attack_timer = 0.0
    attack_visual_timer = 0.0
    next_room_timer = 0.0
    touch_move = Vector2.ZERO
    attack_touch = false
    enemies.clear()
    pickups.clear()
    _spawn_enemy("goblin", Vector2(112, 205))
    _spawn_enemy("goblin", Vector2(246, 250))
    _spawn_enemy("bat", Vector2(180, 155))
    _spawn_enemy("bat", Vector2(270, 365))
    _spawn_enemy("bat", Vector2(92, 365))
    _show_toast("Clear the room")

func _spawn_enemy(kind: String, pos: Vector2) -> void:
    enemies.append({"kind": kind, "pos": pos, "hp": 2 if kind == "goblin" else 1, "attack": 0.0, "hurt": 0.0, "phase": rng.randf_range(0.0, 6.28)})

func _process(delta: float) -> void:
    attack_timer = maxf(0.0, attack_timer - delta)
    attack_visual_timer = maxf(0.0, attack_visual_timer - delta)
    flash_timer = maxf(0.0, flash_timer - delta)
    toast_timer = maxf(0.0, toast_timer - delta)
    _update_player(delta)
    _update_enemies(delta)
    _update_pickups(delta)
    _update_room_state()
    queue_redraw()

func _update_player(delta: float) -> void:
    var dir := touch_move
    if dir.length() < 0.1:
        dir = Input.get_vector("move_left", "move_right", "move_up", "move_down")
    if dir.length() > 1.0:
        dir = dir.normalized()
    player_pos += dir * PLAYER_SPEED * delta
    player_pos.x = clampf(player_pos.x, 31.0, 329.0)
    player_pos.y = clampf(player_pos.y, 80.0, 592.0)
    var wants_attack := Input.is_action_pressed("attack") or attack_touch
    if wants_attack and attack_timer <= 0.0:
        _attack()

func _attack() -> void:
    attack_timer = ATTACK_COOLDOWN
    attack_visual_timer = ATTACK_TIME
    var best_index := -1
    var best_dist := 58.0
    for i in enemies.size():
        var enemy: Dictionary = enemies[i]
        var dist := player_pos.distance_to(enemy["pos"])
        if dist < best_dist:
            best_dist = dist
            best_index = i
    if best_index >= 0:
        var enemy: Dictionary = enemies[best_index]
        enemy["hp"] = int(enemy["hp"]) - 1
        enemy["hurt"] = 0.12
        enemies[best_index] = enemy
        _spawn_hit(enemy["pos"])
        if int(enemy["hp"]) <= 0:
            pickups.append({"pos": enemy["pos"], "kind": "gold", "spark": 0.0})
            enemies.remove_at(best_index)
            xp += 1
            if xp >= level * 5:
                level += 1
                _show_toast("Level %d" % level)
            else:
                _show_toast("Gold dropped")

func _spawn_hit(pos: Vector2) -> void:
    pickups.append({"pos": pos, "kind": "hit", "timer": 0.12})

func _update_enemies(delta: float) -> void:
    for i in enemies.size():
        var enemy: Dictionary = enemies[i]
        enemy["attack"] = maxf(0.0, float(enemy["attack"]) - delta)
        enemy["hurt"] = maxf(0.0, float(enemy["hurt"]) - delta)
        var pos: Vector2 = enemy["pos"]
        var kind: String = enemy["kind"]
        var to_player := player_pos - pos
        var dist := to_player.length()
        if kind == "goblin":
            if dist > 150.0:
                pos += to_player.normalized() * 38.0 * delta
            elif dist < 110.0:
                pos -= to_player.normalized() * 24.0 * delta
            if dist < 190.0 and float(enemy["attack"]) <= 0.0:
                enemy["attack"] = 1.5
                _damage_player(1)
        else:
            var dir := to_player.normalized() if dist > 0.1 else Vector2.ZERO
            var sway := Vector2(cos(Time.get_ticks_msec() * 0.004 + float(enemy["phase"])), sin(Time.get_ticks_msec() * 0.005 + float(enemy["phase"]))) * 0.35
            pos += (dir + sway).normalized() * 55.0 * delta
            if dist < 34.0 and float(enemy["attack"]) <= 0.0:
                enemy["attack"] = 0.9
                _damage_player(1)
        pos.x = clampf(pos.x, 35.0, 325.0)
        pos.y = clampf(pos.y, 75.0, 585.0)
        enemy["pos"] = pos
        enemies[i] = enemy

func _damage_player(amount: int) -> void:
    if flash_timer > 0.0:
        return
    player_hp -= amount
    flash_timer = 0.22
    if player_hp <= 0:
        player_hp = PLAYER_MAX_HP
        gold = max(0, gold - 1)
        _show_toast("Knocked out — keep going")
        player_pos = Vector2(180, 525)

func _update_pickups(delta: float) -> void:
    var remove_indices: Array[int] = []
    for i in pickups.size():
        var item: Dictionary = pickups[i]
        if item["kind"] == "hit":
            item["timer"] = float(item["timer"]) - delta
            pickups[i] = item
            if float(item["timer"]) <= 0.0:
                remove_indices.append(i)
        else:
            item["spark"] = float(item["spark"]) + delta
            pickups[i] = item
            if player_pos.distance_to(item["pos"]) < 22.0:
                gold += GOLD_PER_KILL
                _show_toast("+1 gold")
                remove_indices.append(i)
    for i in remove_indices:
        if i < pickups.size():
            pickups.remove_at(i)

func _update_room_state() -> void:
    if not room_cleared and enemies.is_empty():
        room_cleared = true
        _show_toast("Room clear — exit open!")
    if room_cleared and player_pos.y < 55.0 and absf(player_pos.x - 180.0) < 42.0:
        next_room_timer += get_process_delta_time()
        if next_room_timer > 0.18:
            next_room_number += 1
            _show_toast("Room %d" % next_room_number)
            _start_room()
    else:
        next_room_timer = 0.0

func _show_toast(text_value: String) -> void:
    toast_text = text_value
    toast_timer = 1.25

func _unhandled_input(event: InputEvent) -> void:
    if event is InputEventScreenTouch:
        if event.pressed:
            if event.position.x > 245.0 and event.position.y > 500.0:
                attack_touch = true
            elif event.position.x < 210.0 and event.position.y > 440.0:
                touch_move = (event.position - Vector2(100, 545)).limit_length(70.0) / 70.0
        else:
            attack_touch = false
            touch_move = Vector2.ZERO
    elif event is InputEventScreenDrag:
        if event.position.x > 245.0 and event.position.y > 500.0:
            attack_touch = true
        elif event.position.x < 210.0 and event.position.y > 440.0:
            touch_move = (event.position - Vector2(100, 545)).limit_length(70.0) / 70.0
    elif event is InputEventMouseButton:
        if event.button_index == MOUSE_BUTTON_LEFT:
            if event.pressed:
                if event.position.x > 245.0 and event.position.y > 500.0:
                    attack_touch = true
                elif event.position.x < 210.0 and event.position.y > 440.0:
                    touch_move = (event.position - Vector2(100, 545)).limit_length(70.0) / 70.0
            else:
                attack_touch = false
                touch_move = Vector2.ZERO
    elif event is InputEventMouseMotion and Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT):
        if event.position.x < 210.0 and event.position.y > 440.0:
            touch_move = (event.position - Vector2(100, 545)).limit_length(70.0) / 70.0

func _draw() -> void:
    var bg: Texture2D = room_open if room_cleared else room_closed
    draw_texture_rect(bg, Rect2(0, 0, 360, 640), false)
    _draw_world_objects()
    _draw_player()
    _draw_fx()
    _draw_hud()
    _draw_controls()

func _draw_world_objects() -> void:
    for enemy in enemies:
        var kind: String = enemy["kind"]
        var pos: Vector2 = enemy["pos"]
        var tex: Texture2D = goblin_tex if kind == "goblin" else bat_tex
        var frame_w := 32.0
        var frame_h := 32.0
        var cols := 4 if kind == "goblin" else 4
        var frame := int(Time.get_ticks_msec() / 180) % cols
        var src := Rect2(frame * frame_w, 0, frame_w, frame_h) if kind == "bat" else Rect2(frame * frame_w, 32, frame_w, frame_h)
        draw_texture_rect_region(tex, Rect2(pos.x-16, pos.y-16, 32, 32), src)
    for item in pickups:
        if item["kind"] == "gold":
            draw_texture_rect(gold_tex, Rect2(item["pos"].x-8, item["pos"].y-8, 16, 16), false)
            var pulse := 2.0 + sin(float(item["spark"]) * 8.0) * 2.0
            draw_circle(item["pos"] + Vector2(0,-10), pulse, Color(1.0,0.95,0.55,0.8))

func _draw_player() -> void:
    var frame := int(Time.get_ticks_msec() / 180) % 4
    var row := 1
    var src := Rect2(frame * 32, row * 32, 32, 32)
    draw_texture_rect_region(player_tex, Rect2(player_pos.x-16, player_pos.y-16, 32, 32), src)
    if flash_timer > 0.0:
        draw_circle(player_pos, 22.0, Color(1,0.35,0.35,0.28))

func _draw_fx() -> void:
    if attack_visual_timer > 0.0:
        draw_texture_rect(slash_tex, Rect2(player_pos.x-24, player_pos.y-24, 48, 48), false)
    for item in pickups:
        if item["kind"] == "hit":
            var alpha := clampf(float(item["timer"]) / 0.12, 0.0, 1.0)
            draw_texture_rect(hit_tex, Rect2(item["pos"].x-16, item["pos"].y-16, 32, 32), false, Color(1,1,1,alpha))
    if room_cleared:
        var glow := 0.18 + (sin(Time.get_ticks_msec() * 0.006) + 1.0) * 0.06
        draw_circle(Vector2(180, 29), 24.0, Color(0.35,0.8,1.0,glow))

func _draw_hud() -> void:
    draw_rect(Rect2(8, 8, 344, 34), Color(18,20,28,0.88), true)
    draw_string(ThemeDB.fallback_font, Vector2(18, 30), "HP %d/%d" % [player_hp, PLAYER_MAX_HP], HORIZONTAL_ALIGNMENT_LEFT, -1, 16, Color(255,225,225))
    draw_string(ThemeDB.fallback_font, Vector2(115, 30), "LV %d  XP %d" % [level, xp], HORIZONTAL_ALIGNMENT_LEFT, -1, 16, Color(225,235,255))
    draw_string(ThemeDB.fallback_font, Vector2(275, 30), "G %d" % gold, HORIZONTAL_ALIGNMENT_LEFT, -1, 16, Color(255,235,150))
    if toast_timer > 0.0:
        var a := minf(1.0, toast_timer)
        draw_rect(Rect2(74, 50, 212, 30), Color(15,17,24,0.82*a), true)
        draw_string(ThemeDB.fallback_font, Vector2(86, 71), toast_text, HORIZONTAL_ALIGNMENT_CENTER, 188, 14, Color(245,245,245,a))

func _draw_controls() -> void:
    var base := Vector2(100,545)
    draw_circle(base, 58.0, Color(15,18,25,0.48))
    draw_circle(base + touch_move * 30.0, 26.0, Color(215,225,240,0.34))
    draw_circle(Vector2(306,555), 46.0, Color(35,65,90,0.70))
    draw_circle(Vector2(306,555), 34.0, Color(80,145,190,0.32))
    draw_string(ThemeDB.fallback_font, Vector2(282, 560), "ATTACK", HORIZONTAL_ALIGNMENT_LEFT, -1, 12, Color(245,250,255,0.9))
