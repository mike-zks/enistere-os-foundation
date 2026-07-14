import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_flutter/src/core/upload/app_file.dart';

void main() {
  group('AppFile', () {
    test('valid file has non-empty path, name, mimeType with slash', () {
      const file = AppFile(
        path: '/tmp/photo.jpg',
        name: 'photo.jpg',
        mimeType: 'image/jpeg',
      );
      expect(isValidAppFile(file), isTrue);
    });

    test('invalid when path is empty', () {
      const file = AppFile(path: '', name: 'photo.jpg', mimeType: 'image/jpeg');
      expect(isValidAppFile(file), isFalse);
    });

    test('invalid when name is empty', () {
      const file = AppFile(
        path: '/tmp/photo.jpg',
        name: '',
        mimeType: 'image/jpeg',
      );
      expect(isValidAppFile(file), isFalse);
    });

    test('invalid when mimeType is empty', () {
      const file = AppFile(
        path: '/tmp/photo.jpg',
        name: 'photo.jpg',
        mimeType: '',
      );
      expect(isValidAppFile(file), isFalse);
    });

    test('invalid when mimeType has no slash', () {
      const file = AppFile(
        path: '/tmp/photo.jpg',
        name: 'photo.jpg',
        mimeType: 'imagejpeg',
      );
      expect(isValidAppFile(file), isFalse);
    });

    test('sizeBytes is optional', () {
      const withSize = AppFile(
        path: '/tmp/a.pdf',
        name: 'a.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
      );
      const withoutSize = AppFile(
        path: '/tmp/a.pdf',
        name: 'a.pdf',
        mimeType: 'application/pdf',
      );
      expect(withSize.sizeBytes, 1024);
      expect(withoutSize.sizeBytes, isNull);
    });
  });

  group('describeFileForLog', () {
    test('returns mimeType from the file', () {
      const file = AppFile(
        path: '/private/john_passport.jpg',
        name: 'john_passport.jpg',
        mimeType: 'image/jpeg',
      );
      final desc = describeFileForLog(file);
      expect(desc.mimeType, 'image/jpeg');
    });

    test('extracts lowercased extension', () {
      const file = AppFile(
        path: '/tmp/doc.PDF',
        name: 'doc.PDF',
        mimeType: 'application/pdf',
      );
      expect(describeFileForLog(file).extension, 'pdf');
    });

    test('returns null extension when no dot in name', () {
      const file = AppFile(
        path: '/tmp/nodot',
        name: 'nodot',
        mimeType: 'application/octet-stream',
      );
      expect(describeFileForLog(file).extension, isNull);
    });

    test('returns null extension for trailing dot', () {
      const file = AppFile(
        path: '/tmp/file.',
        name: 'file.',
        mimeType: 'application/octet-stream',
      );
      expect(describeFileForLog(file).extension, isNull);
    });

    test('returns null extension when extension exceeds 12 chars', () {
      const file = AppFile(
        path: '/tmp/file.verylongextension',
        name: 'file.verylongextension',
        mimeType: 'application/octet-stream',
      );
      expect(describeFileForLog(file).extension, isNull);
    });

    test('never includes path', () {
      const file = AppFile(
        path: '/private/sensitive/path/photo.jpg',
        name: 'photo.jpg',
        mimeType: 'image/jpeg',
      );
      final desc = describeFileForLog(file);
      // SafeFileDescriptor has no path field
      expect(desc.mimeType, 'image/jpeg');
      expect(desc.extension, 'jpg');
    });

    test('never includes raw filename', () {
      const file = AppFile(
        path: '/tmp/john_passport.jpg',
        name: 'john_passport.jpg',
        mimeType: 'image/jpeg',
      );
      final desc = describeFileForLog(file);
      // Only mimeType and sanitised extension — no raw name
      expect(desc.mimeType, 'image/jpeg');
      expect(desc.extension, 'jpg');
    });
  });

  group('isAllowedUploadContentType', () {
    test('exact match passes', () {
      const file = AppFile(
        path: '/tmp/img.jpg',
        name: 'img.jpg',
        mimeType: 'image/jpeg',
      );
      expect(isAllowedUploadContentType(file, ['image/jpeg']), isTrue);
    });

    test('wrong exact type fails', () {
      const file = AppFile(
        path: '/tmp/img.jpg',
        name: 'img.jpg',
        mimeType: 'image/jpeg',
      );
      expect(isAllowedUploadContentType(file, ['application/pdf']), isFalse);
    });

    test('group wildcard passes', () {
      const file = AppFile(
        path: '/tmp/img.png',
        name: 'img.png',
        mimeType: 'image/png',
      );
      expect(isAllowedUploadContentType(file, ['image/*']), isTrue);
    });

    test('group wildcard does not pass wrong group', () {
      const file = AppFile(
        path: '/tmp/doc.pdf',
        name: 'doc.pdf',
        mimeType: 'application/pdf',
      );
      expect(isAllowedUploadContentType(file, ['image/*']), isFalse);
    });

    test('*/* wildcard passes all', () {
      const file = AppFile(
        path: '/tmp/any.bin',
        name: 'any.bin',
        mimeType: 'application/octet-stream',
      );
      expect(isAllowedUploadContentType(file, ['*/*']), isTrue);
    });

    test('empty allowedTypes passes all (no filter)', () {
      const file = AppFile(
        path: '/tmp/any.bin',
        name: 'any.bin',
        mimeType: 'application/octet-stream',
      );
      expect(isAllowedUploadContentType(file, []), isTrue);
    });

    test('multi-type list matches any entry', () {
      const file = AppFile(
        path: '/tmp/vid.mp4',
        name: 'vid.mp4',
        mimeType: 'video/mp4',
      );
      expect(
        isAllowedUploadContentType(file, ['image/jpeg', 'video/mp4']),
        isTrue,
      );
    });
  });
}
