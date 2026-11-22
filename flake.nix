{
  description = "Bevy game development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    rust-overlay = {
      url = "github:oxalica/rust-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    {
      self,
      nixpkgs,
      rust-overlay,
    }:
    let
      systems = [
        "aarch64-darwin"
        "x86_64-darwin"
        "x86_64-linux"
        "aarch64-linux"
      ];
      forAllSystems =
        f:
        nixpkgs.lib.genAttrs systems (
          system:
          f (
            import nixpkgs {
              inherit system;
              overlays = [ (import rust-overlay) ];
            }
          )
        );
    in
    {
      devShells = forAllSystems (
        pkgs:
        let
          rustToolchain = pkgs.rust-bin.stable.latest.default.override {
            extensions = [
              "rust-src"
              "rust-analyzer"
              "clippy"
              "rustfmt"
            ];
          };

          # Linux runtime/build libraries required by Bevy (Vulkan, windowing, audio)
          linuxLibs = with pkgs; [
            udev
            alsa-lib
            vulkan-loader
            xorg.libX11
            xorg.libXcursor
            xorg.libXi
            xorg.libXrandr
            libxkbcommon
            wayland
          ];
        in
        {
          default = pkgs.mkShell {
            nativeBuildInputs =
              with pkgs;
              [
                rustToolchain
                pkg-config
              ]
              ++ lib.optionals stdenv.hostPlatform.isLinux [
                clang
                mold
              ];

            # On macOS, modern nixpkgs includes Apple SDK frameworks (Metal, AppKit,
            # Foundation, QuartzCore, CoreAudio, etc.) automatically via stdenv.
            buildInputs =
              pkgs.lib.optionals pkgs.stdenv.hostPlatform.isDarwin [
                pkgs.libiconv
              ]
              ++ pkgs.lib.optionals pkgs.stdenv.hostPlatform.isLinux linuxLibs;

            LD_LIBRARY_PATH = pkgs.lib.optionalString pkgs.stdenv.hostPlatform.isLinux (
              pkgs.lib.makeLibraryPath linuxLibs
            );

            shellHook = ''
              echo "Bevy dev shell ready ($(rustc --version), $(cargo --version))"
            '';
          };
        }
      );
    };
}
