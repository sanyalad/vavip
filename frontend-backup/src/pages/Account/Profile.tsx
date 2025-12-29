import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { authApi } from '@/services/api'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import styles from './Account.module.css'

const profileSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function Profile() {
  const { user } = useAuth()
  const { updateUser } = useAuthStore()
  const { addToast } = useUIStore()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      phone: user?.phone || '',
    },
  })

  const updateMutation = useMutation({
    mutationFn: authApi.updateMe,
    onSuccess: (data) => {
      updateUser(data)
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      addToast({ type: 'success', message: '╨Я╤А╨╛╤Д╨╕╨╗╤М ╨╛╨▒╨╜╨╛╨▓╨╗╨╡╨╜' })
    },
    onError: () => {
      addToast({ type: 'error', message: '╨Ю╤И╨╕╨▒╨║╨░ ╨╛╨▒╨╜╨╛╨▓╨╗╨╡╨╜╨╕╤П' })
    },
  })

  const onSubmit = (data: ProfileFormData) => {
    updateMutation.mutate(data)
  }

  return (
    <div className={styles.section}>
      <h1 className={styles.sectionTitle}>╨Я╤А╨╛╤Д╨╕╨╗╤М</h1>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <div className={styles.formGrid}>
          <Input
            label="╨Ш╨╝╤П"
            placeholder="╨Ш╨▓╨░╨╜"
            error={errors.first_name?.message}
            {...register('first_name')}
          />
          <Input
            label="╨д╨░╨╝╨╕╨╗╨╕╤П"
            placeholder="╨Ш╨▓╨░╨╜╨╛╨▓"
            error={errors.last_name?.message}
            {...register('last_name')}
          />
        </div>

        <Input
          label="Email"
          type="email"
          value={user?.email || ''}
          disabled
        />

        <Input
          label="╨в╨╡╨╗╨╡╤Д╨╛╨╜"
          type="tel"
          placeholder="+7 (999) 123-45-67"
          error={errors.phone?.message}
          {...register('phone')}
        />

        <Button
          type="submit"
          disabled={!isDirty}
          isLoading={updateMutation.isPending}
        >
          ╨б╨╛╤Е╤А╨░╨╜╨╕╤В╤М ╨╕╨╖╨╝╨╡╨╜╨╡╨╜╨╕╤П
        </Button>
      </form>
    </div>
  )
}












