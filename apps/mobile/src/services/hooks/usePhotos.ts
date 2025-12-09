import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { photoService, type PhotoListParams, type PhotoCommitRequest } from '../api/photoService';

export function usePhotos(params?: PhotoListParams) {
  return useQuery({
    queryKey: queryKeys.photos.list(params),
    queryFn: () => photoService.list(params),
  });
}

export function usePhoto(id: string) {
  return useQuery({
    queryKey: queryKeys.photos.single(id),
    queryFn: () => photoService.get(id),
    enabled: !!id,
  });
}

interface UploadPhotoParams {
  imageUri: string;
  filename: string;
  contentType: string;
  date: string;
  visibility?: 'private' | 'coach_only';
  metadata?: Record<string, unknown>;
}

export function useUploadPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      imageUri,
      filename,
      contentType,
      date,
      visibility = 'private',
      metadata,
    }: UploadPhotoParams) => {
      // Step 1: Get presigned URL
      const presignResponse = await photoService.presign(filename, contentType);

      // Step 2: Upload to S3
      await photoService.uploadToS3(presignResponse.upload_url, imageUri, contentType);

      // Step 3: Commit the upload
      const commitData: PhotoCommitRequest = {
        photo_id: presignResponse.photo_id,
        s3_key: presignResponse.s3_key,
        date,
        visibility,
        metadata,
      };
      return photoService.commit(commitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.photos.all });
    },
  });
}

export function useDeletePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (photoId: string) => photoService.delete(photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.photos.all });
    },
  });
}
