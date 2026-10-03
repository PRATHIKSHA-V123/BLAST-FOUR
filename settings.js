// ===== Settings page =====

const $ = (id) => document.getElementById(id);

$('musicToggle').onclick = () => Sound.setMusic(!Sound.musicOn);
$('sfxToggle').onclick = () => {
  Sound.setSfx(!Sound.sfxOn);
  Sound.play('click');
};
$('volume').value = Sound.volume;
$('volume').oninput = () => Sound.setVolume(Number($('volume').value));

document.querySelectorAll('[data-sound]').forEach((button) => {
  button.onclick = () => Sound.play(button.dataset.sound);
});
Sound.showLabels();
