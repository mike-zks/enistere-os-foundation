import { Injectable } from '@nestjs/common';

export interface DetectedType {
  mimeType: string;
  extension: string;
}

/**
 * Détection du type RÉEL par signatures binaires (magic bytes), pour les formats V1
 * supportés : JPEG, PNG, GIF, WebP, PDF. Le MIME déclaré par le client n'est jamais
 * une preuve : seul le contenu fait foi. Un contenu non identifié est refusé en amont.
 *
 * Choix : détecteur ciblé maison plutôt que `file-type` (ESM-only, friction avec le starter
 * CommonJS). Périmètre volontairement restreint ; ce n'est pas un antivirus.
 */
@Injectable()
export class ContentTypeDetector {
  detect(buffer: Buffer): DetectedType | null {
    if (this.isJpeg(buffer)) {
      return { mimeType: 'image/jpeg', extension: 'jpg' };
    }
    if (this.isPng(buffer)) {
      return { mimeType: 'image/png', extension: 'png' };
    }
    if (this.isGif(buffer)) {
      return { mimeType: 'image/gif', extension: 'gif' };
    }
    if (this.isWebp(buffer)) {
      return { mimeType: 'image/webp', extension: 'webp' };
    }
    if (this.isPdf(buffer)) {
      return { mimeType: 'application/pdf', extension: 'pdf' };
    }
    return null;
  }

  private isJpeg(b: Buffer): boolean {
    return b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  }

  private isPng(b: Buffer): boolean {
    return (
      b.length >= 8 &&
      b[0] === 0x89 &&
      b[1] === 0x50 &&
      b[2] === 0x4e &&
      b[3] === 0x47 &&
      b[4] === 0x0d &&
      b[5] === 0x0a &&
      b[6] === 0x1a &&
      b[7] === 0x0a
    );
  }

  private isGif(b: Buffer): boolean {
    if (b.length < 6) {
      return false;
    }
    const signature = b.toString('latin1', 0, 6);
    return signature === 'GIF87a' || signature === 'GIF89a';
  }

  private isWebp(b: Buffer): boolean {
    return (
      b.length >= 12 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP'
    );
  }

  private isPdf(b: Buffer): boolean {
    return b.length >= 5 && b.toString('latin1', 0, 5) === '%PDF-';
  }
}
