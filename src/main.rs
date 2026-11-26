use bevy::prelude::*;

fn main() {
    App::new()
        .add_plugins(DefaultPlugins.set(WindowPlugin {
            primary_window: Some(Window {
                title: "Tag".into(),
                resolution: (1000, 720).into(),
                ..default()
            }),
            ..default()
        }))
        .insert_resource(ClearColor(Color::srgb(0.05, 0.07, 0.10)))
        .insert_resource(ArenaBounds {
            half_size: Vec2::new(ARENA_WIDTH * 0.5, ARENA_HEIGHT * 0.5),
        })
        .add_systems(Startup, (setup_camera, spawn_arena, spawn_player))
        .add_systems(
            FixedUpdate,
            (player_input, apply_velocity, confine_to_arena).chain(),
        )
        .run();
}

pub const ARENA_WIDTH: f32 = 800.0;
pub const ARENA_HEIGHT: f32 = 560.0;
pub const WALL_THICKNESS: f32 = 16.0;

#[derive(Resource, Clone, Copy, Debug)]
pub struct ArenaBounds {
    pub half_size: Vec2,
}

#[derive(Component)]
pub struct Wall;

fn setup_camera(mut commands: Commands) {
    commands.spawn(Camera2d);
}

fn spawn_arena(mut commands: Commands, arena: Res<ArenaBounds>) {
    let full_size = arena.half_size * 2.0;
    let wall_color = Color::srgb(0.28, 0.34, 0.45);

    // Open Arena Floor (z=0.0)
    commands.spawn((
        Sprite::from_color(Color::srgb(0.11, 0.14, 0.19), full_size),
        Transform::from_xyz(0.0, 0.0, 0.0),
    ));

    // Arena perimiter walls
    let half_w = arena.half_size.x;
    let half_h = arena.half_size.y;
    let half_t = WALL_THICKNESS * 0.5;

    let walls = [
        (
            0.0,
            half_h + half_t,
            full_size.x + WALL_THICKNESS * 2.0,
            WALL_THICKNESS,
        ), // top
        (
            0.0,
            -(half_h + half_t),
            full_size.x + WALL_THICKNESS * 2.0,
            WALL_THICKNESS,
        ), // bottom
        (-(half_w + half_t), 0.0, WALL_THICKNESS, full_size.y), // left
        (half_w + half_t, 0.0, WALL_THICKNESS, full_size.y),    // right
    ];

    for (x, y, w, h) in walls {
        commands.spawn((
            Wall,
            Sprite::from_color(wall_color, Vec2::new(w, h)),
            Transform::from_xyz(x, y, 1.0),
        ));
    }
}

// Characters

pub const CHARACTER_SIZE: f32 = 28.0;
pub const BASE_SPEED: f32 = 220.0;
pub const PLAYER_SPEED_MULTIPLIER: f32 = 1.2;
pub const PLAYER_ACCEL: f32 = 18.0;

#[derive(Component)]
pub struct Character;

#[derive(Component)]
pub struct Player;

#[derive(Component, Default, Clone, Copy, Debug, Deref, DerefMut)]
pub struct Velocity(pub Vec2);

#[derive(Component, Clone, Copy, Debug)]
pub struct MoveSpeed(pub f32);

#[derive(Component, Clone, Copy, Debug)]
pub struct Collider {
    pub half_size: Vec2,
}

// Spawn players system
fn spawn_player(mut commands: Commands) {
    commands.spawn((
        Character,
        Player,
        Sprite::from_color(Color::srgb(0.30, 0.67, 0.97), Vec2::splat(CHARACTER_SIZE)),
        Transform::from_xyz(0.0, 0.0, 2.0),
        Velocity::default(),
        MoveSpeed(BASE_SPEED * PLAYER_SPEED_MULTIPLIER),
        Collider {
            half_size: Vec2::splat(CHARACTER_SIZE * 0.5),
        },
    ));
}

fn player_input(
    keyboard: Res<ButtonInput<KeyCode>>,
    time: Res<Time>,
    mut query: Query<(&MoveSpeed, &mut Velocity), With<Player>>,
) {
    let mut dir = Vec2::ZERO;
    if keyboard.pressed(KeyCode::KeyW) || keyboard.pressed(KeyCode::ArrowUp) {
        dir.y += 1.0;
    }
    if keyboard.pressed(KeyCode::KeyS) || keyboard.pressed(KeyCode::ArrowDown) {
        dir.y -= 1.0;
    }
    if keyboard.pressed(KeyCode::KeyD) || keyboard.pressed(KeyCode::ArrowRight) {
        dir.x += 1.0;
    }
    if keyboard.pressed(KeyCode::KeyA) || keyboard.pressed(KeyCode::ArrowLeft) {
        dir.x -= 1.0;
    }

    let unit_dir = dir.normalize_or_zero();
    let blend = (PLAYER_ACCEL * time.delta_secs()).min(1.0);

    for (speed, mut velocity) in &mut query {
        let desired = unit_dir * speed.0;
        velocity.0 = velocity.0.lerp(desired, blend);
    }
}

fn apply_velocity(time: Res<Time>, mut query: Query<(&Velocity, &mut Transform)>) {
    let dt = time.delta_secs();
    for (velocity, mut transform) in &mut query {
        transform.translation += velocity.0.extend(0.0) * dt;
    }
}

fn confine_to_arena(
    arena: Res<ArenaBounds>,
    mut query: Query<(&mut Transform, &mut Velocity, &Collider)>,
) {
    for (mut transform, mut velocity, collider) in &mut query {
        let limit = arena.half_size - collider.half_size;

        if transform.translation.x > limit.x {
            transform.translation.x = limit.x;
            if velocity.0.x > 0.0 {
                velocity.0.x = 0.0;
            }
        } else if transform.translation.x < -limit.x {
            transform.translation.x = -limit.x;
            if velocity.0.x < 0.0 {
                velocity.0.x = 0.0;
            }
        }

        if transform.translation.y > limit.y {
            transform.translation.y = limit.y;
            if velocity.0.y > 0.0 {
                velocity.0.y = 0.0;
            }
        } else if transform.translation.y < -limit.y {
            transform.translation.y = -limit.y;
            if velocity.0.y < 0.0 {
                velocity.0.y = 0.0;
            }
        }
    }
}
