'use client'

import AdminHeader from '@/components/admin/AdminHeader'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import FileUpload from '@/components/ui/FileUpload'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/context/ToastContext'
import { Save } from 'lucide-react'

export default function DoctorProfilePage() {
  const { user } = useAuth()
  const toast = useToast()

  return (
    <div>
      <AdminHeader title="Profile" subtitle="Update your profile" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Profile Photo">
          <FileUpload purpose="doctor_avatar" accept="image/*" label="Upload Photo" onSuccess={() => toast.success('Photo uploaded')} />
        </Card>
        <Card title="Personal Information" action={<Button size="xs" leftIcon={<Save className="w-3 h-3" />} onClick={() => toast.info('Coming soon')}>Save</Button>}>
          <div className="space-y-3">
            <Input label="Name" defaultValue={user?.name} />
            <Input label="Email" defaultValue={user?.email} />
            <Input label="Phone" defaultValue={user?.phone} />
          </div>
        </Card>
      </div>
    </div>
  )
}