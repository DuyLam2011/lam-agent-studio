#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
export PATH="$HOME/.cargo/w64devkit/bin:$HOME/.cargo/bin:$PATH"
export LIBNODE_PATH="$HOME/.cargo/libnode"
SELF_CONTAINED_DIR="C:/Users/Admin/.rustup/toolchains/stable-x86_64-pc-windows-gnu/lib/rustlib/x86_64-pc-windows-gnu/lib/self-contained"
export RUSTFLAGS="-C link-args=-L${SELF_CONTAINED_DIR} -C link-args=-LC:/Users/Admin/.cargo/libnode"

cd "$DIR/crates/lam-agent-core"
echo "==> Building native Rust core engine (release)..."
~/.cargo/bin/cargo.exe build --release --color always

echo "==> Packaging native .node addon..."
cp target/release/lam_agent_core.dll target/release/lam_agent_core.node
cp target/release/lam_agent_core.dll "$DIR/crates/lam-agent-core/lam_agent_core.node"
echo "==> Native Rust addon compiled successfully at crates/lam-agent-core/lam_agent_core.node"
ls -lh "$DIR/crates/lam-agent-core/lam_agent_core.node"
