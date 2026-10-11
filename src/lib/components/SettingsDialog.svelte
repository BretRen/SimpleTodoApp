<script lang="ts">
  import {
    isOfficialWorkspace,
    officialWorkspaceName,
  } from "#lib/official.ts";

  let {
    dialog = $bindable(),
    workspace = $bindable(),
    encryptionEnabled,
    onEnableEncryption,
  }: {
    dialog?: HTMLDialogElement;
    workspace: string;
    encryptionEnabled: boolean;
    onEnableEncryption: (password: string) => Promise<void>;
  } = $props();
  let editWorkspace = $state(workspace);
  let workspaces = $state<string[]>([]);
  let newWorkspace = $state("");
  const disabled = $derived(
    !editWorkspace.trim() || editWorkspace === workspace,
  );
  let encryptionPassword = $state("");
  let confirmPassword = $state("");
  let encryptionError = $state("");
  let enabling = $state(false);
  let encryptionDialog = $state<HTMLDialogElement>();
  let confirmDeleteWorkspace = $state(false);

  function loadWorkspaces() {
    const saved = Object.keys(localStorage)
      .filter((key) => key.endsWith("-todos"))
      .map((key) => key.replace("-todos", ""))
      .filter((name) => !isOfficialWorkspace(name));
    workspaces = [officialWorkspaceName, ...saved];
  }

  function save() {
    const next = editWorkspace.trim();
    if (!next || next === workspace) return;
    workspace = next;
    dialog?.close();
  }

  function createNew() {
    const val = newWorkspace.trim();
    if (!val) return;
    editWorkspace = val;
    newWorkspace = "";
  }

  function deleteWorkspace() {
    if (editWorkspace === "default" || isOfficialWorkspace(editWorkspace)) return;
    if (!confirmDeleteWorkspace) {
      confirmDeleteWorkspace = true;
      return;
    }

    localStorage.removeItem(editWorkspace + "-todos");
    loadWorkspaces();

    if (editWorkspace === workspace) {
      workspace = "default";
    }

    editWorkspace = workspace;
    confirmDeleteWorkspace = false;
  }

  async function confirmEncryption() {
    encryptionError = "";
    if (!encryptionPassword.trim()) {
      encryptionError = "Enter a password";
      return;
    }
    if (encryptionPassword !== confirmPassword) {
      encryptionError = "Passwords do not match";
      return;
    }

    enabling = true;
    try {
      await onEnableEncryption(encryptionPassword);
      encryptionPassword = "";
      confirmPassword = "";
      encryptionDialog?.close();
    } catch {
      encryptionError = "Could not enable encryption";
    } finally {
      enabling = false;
    }
  }

  $effect(() => {
    loadWorkspaces();
    editWorkspace = workspace;
  });
</script>

<dialog bind:this={dialog} class="modal">
  <div class="modal-box">
    <h3 class="text-lg font-bold">Settings</h3>

    <fieldset class="fieldset mt-4">
      <legend class="fieldset-legend">Workspace</legend>

      <select
        onchange={() => (confirmDeleteWorkspace = false)}
        bind:value={editWorkspace}
        class="select w-full"
      >
        {#each workspaces as ws}
          <option value={ws}>{ws}</option>
        {/each}
        {#if editWorkspace && !workspaces.includes(editWorkspace)}
          <option value={editWorkspace}>{editWorkspace} (new)</option>
        {/if}
      </select>

      <div class="flex gap-2 mt-2">
        <input
          type="text"
          placeholder="Or create a new one"
          class="input flex-1"
          bind:value={newWorkspace}
          onkeydown={(e) => e.key === "Enter" && createNew()}
        />
        <button type="button" class="btn" onclick={createNew}>Add</button>
      </div>
      <button
        class="btn btn-soft btn-error"
        disabled={editWorkspace === "default" ||
          isOfficialWorkspace(editWorkspace)}
        onclick={deleteWorkspace}
      >
        {editWorkspace === "default"
          ? "You can not delete default workspace"
          : isOfficialWorkspace(editWorkspace)
            ? "You can not delete the official workspace"
            : confirmDeleteWorkspace
              ? "Confirm Delete"
              : "Delete Workspace"}
      </button>
    </fieldset>

    <fieldset class="fieldset mt-4">
      <legend class="fieldset-legend">Functions</legend>
      <button
        class="btn"
        disabled={encryptionEnabled ||
          editWorkspace !== workspace ||
          isOfficialWorkspace(editWorkspace)}
        onclick={() => {
          encryptionError = "";
          encryptionDialog?.showModal();
        }}
      >
        {encryptionEnabled && editWorkspace === workspace
          ? "Encryption is enabled"
          : "Enable encryption"}
      </button>
      {#if editWorkspace !== workspace}
        <p class="text-sm text-gray-500">
          Save the workspace switch before enabling encryption.
        </p>
      {/if}
    </fieldset>

    <div class="modal-action">
      <button class="btn" onclick={() => dialog?.close()}>Cancel</button>
      <button class="btn btn-primary" {disabled} onclick={save}>Save</button>
    </div>
  </div>

  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>

<dialog bind:this={encryptionDialog} class="modal">
  <div class="modal-box">
    <h3 class="text-lg font-bold text-center">Enable Encryption</h3>

    <div role="alert" class="alert alert-soft alert-warning mt-4">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-6 w-6 shrink-0 stroke-current"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <span>Once encryption is enabled, it cannot be disabled.</span>
    </div>

    <fieldset class="fieldset w-full mt-4">
      <legend class="fieldset-legend"
        >Set an encryption password to continue.</legend
      >
      <form
        class="flex flex-col gap-2"
        onsubmit={(e) => {
          e.preventDefault();
          confirmEncryption();
        }}
      >
        <input
          bind:value={encryptionPassword}
          type="password"
          class="input w-full"
          placeholder="Password"
          autocomplete="new-password"
        />
        <input
          bind:value={confirmPassword}
          type="password"
          class="input w-full"
          placeholder="Confirm password"
          autocomplete="new-password"
        />
        {#if encryptionError}
          <p class="text-error text-sm">{encryptionError}</p>
        {/if}
        <button class="btn" type="submit" disabled={enabling}>
          {enabling ? "Encrypting..." : "Confirm"}
        </button>
      </form>
    </fieldset>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>
