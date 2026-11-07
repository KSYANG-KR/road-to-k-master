// 연출(녹화) 모드 디렉터
//  ?auto=1   : 입력 없이 자동으로 플레이 (콘티 순서대로 진행)
//  ?scene=X  : 특정 씬/미션부터 시작 (예: scene=hansik)
//  ?rec=1    : 캔버스+오디오를 WebM으로 녹화, 엔딩에서 자동 저장
//  ?only=1   : (scene과 함께) 해당 씬 하나만 녹화하고 멈춤 → <scene>.webm
//  ?clean=1  : 커서 숨김
import Phaser from 'phaser';
import { audioStream } from './audio';

const q = new URLSearchParams(location.search);

class Director {
  auto = q.has('auto') || q.has('rec');
  rec = q.has('rec');
  start = q.get('scene') ?? '';
  speed = Number(q.get('speed') ?? 1);
  only = q.has('only');
  stopped = false;
  private recorder?: MediaRecorder;
  private chunks: Blob[] = [];
  // 개발 서버 녹화: 조각을 바로 captures/ 에 이어 붙여 저장 (긴 녹화도 메모리에 쌓지 않음)
  private stream = q.has('stream') && import.meta.env.DEV;
  private sent: Promise<unknown> = Promise.resolve();
  private recName = q.get('recname') ?? 'road-to-k-master.webm';

  // 씬 시간 기준 대기 (씬이 멈추면 같이 멈춤)
  wait(scene: Phaser.Scene, ms: number) {
    return new Promise<void>((ok) => {
      if (!scene.sys.isActive() && !scene.sys.isVisible()) return ok();
      scene.time.delayedCall(ms / this.speed, () => ok());
    });
  }

  // 사람이 플레이할 땐 입력을 기다리고, 자동 모드에선 지정 시간 후 진행
  waitInput(scene: Phaser.Scene, autoMs = 900) {
    if (this.auto) return this.wait(scene, autoMs);
    return new Promise<void>((ok) => {
      const done = () => {
        scene.input.off('pointerdown', done);
        scene.input.keyboard?.off('keydown', done);
        ok();
      };
      scene.time.delayedCall(250, () => {
        scene.input.once('pointerdown', done);
        scene.input.keyboard?.once('keydown', done);
      });
    });
  }

  startRecording(canvas: HTMLCanvasElement) {
    if (!this.rec || this.recorder) return;
    document.body.classList.add('recording');
    const stream = canvas.captureStream(Number(q.get('fps')) || 60);
    try {
      audioStream().getAudioTracks().forEach((t) => stream.addTrack(t));
    } catch { /* 오디오 없이 녹화 */ }
    const mime = [q.get('mime') ?? '', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((m) => m && MediaRecorder.isTypeSupported(m));
    this.recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: Number(q.get('vbr')) || 12_000_000 });
    if (this.stream) fetch(`/__capture?name=${this.recName}`, { method: 'POST', body: '' });
    this.recorder.ondataavailable = (e) => {
      if (!e.data.size) return;
      if (!this.stream) { this.chunks.push(e.data); return; }
      const d = e.data;
      this.sent = this.sent.then(() => fetch(`/__capture?name=${this.recName}&append=1`, { method: 'POST', body: d }));
    };
    this.recorder.start(1000);
  }

  async stopRecording(name = 'road-to-k-master.webm') {
    if (!this.recorder) return;
    const rec = this.recorder;
    await new Promise<void>((ok) => { rec.onstop = () => ok(); rec.stop(); });
    if (this.stream) {
      await this.sent;
      await fetch(`/__capture?name=${this.recName}.done`, { method: 'POST', body: 'done' });
      return;
    }
    const blob = new Blob(this.chunks, { type: 'video/webm' });
    // 개발 서버면 captures/ 로 저장, 아니면 다운로드
    try {
      const r = await fetch(`/__capture?name=${name}`, { method: 'POST', body: blob });
      if (r.ok) return;
    } catch { /* fallthrough */ }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
  }
}

export const director = new Director();
