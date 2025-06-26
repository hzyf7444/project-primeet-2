'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Copy, 
  Users, 
  Lock, 
  Unlock, 
  Shield, 
  Clock,
  Share2,
  Settings,
  Video
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

export default function CreateMeetingPage() {
  const router = useRouter();
  const [meetingSettings, setMeetingSettings] = useState({
    title: '',
    description: '',
    isPrivate: false,
    requirePassword: false,
    password: '',
    enableLobby: true,
    maxParticipants: 50,
    enableRecording: false,
  });

  const [generatedMeetingId, setGeneratedMeetingId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const generateMeetingId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateMeeting = async () => {
    if (!meetingSettings.title.trim()) {
      toast.error('Lütfen toplantı başlığını girin');
      return;
    }

    if (meetingSettings.requirePassword && !meetingSettings.password.trim()) {
      toast.error('Şifre koruması için şifre girmeniz gerekiyor');
      return;
    }

    setIsCreating(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const meetingId = generateMeetingId();
    setGeneratedMeetingId(meetingId);
    
    toast.success('Toplantı başarıyla oluşturuldu!');
    setIsCreating(false);
  };

  const handleJoinMeeting = () => {
    if (generatedMeetingId) {
      router.push(`/meeting/${generatedMeetingId}`);
    }
  };

  const copyMeetingLink = () => {
    const link = `${window.location.origin}/meeting/${generatedMeetingId}`;
    navigator.clipboard.writeText(link);
    toast.success('Toplantı bağlantısı kopyalandı!');
  };

  const copyMeetingId = () => {
    navigator.clipboard.writeText(generatedMeetingId);
    toast.success('Toplantı ID\'si kopyalandı!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      <Toaster />
      
      {/* Header */}
      <header className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white/80 backdrop-blur dark:bg-gray-800/80">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Yeni Toplantı Oluştur</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">Toplantı ayarlarını yapılandırın</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {!generatedMeetingId ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur dark:bg-gray-800/80">
                <CardHeader>
                  <CardTitle className="text-2xl text-gray-900 dark:text-white">Toplantı Detayları</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">
                    Toplantınızın ayarlarını yapılandırın
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-8">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-sm font-medium">
                        Toplantı Başlığı *
                      </Label>
                      <Input
                        id="title"
                        placeholder="Örn: Haftalık Ekip Toplantısı"
                        value={meetingSettings.title}
                        onChange={(e) => setMeetingSettings(prev => ({ ...prev, title: e.target.value }))}
                        className="h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-medium">
                        Açıklama (İsteğe Bağlı)
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Toplantı hakkında ek bilgiler..."
                        value={meetingSettings.description}
                        onChange={(e) => setMeetingSettings(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Security Settings */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Güvenlik Ayarları</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            Özel Toplantı
                          </Label>
                          <p className="text-xs text-gray-600 dark:text-gray-300">
                            Sadece davet edilenler katılabilir
                          </p>
                        </div>
                        <Switch
                          checked={meetingSettings.isPrivate}
                          onCheckedChange={(checked) => 
                            setMeetingSettings(prev => ({ ...prev, isPrivate: checked }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Lobi Sistemi
                          </Label>
                          <p className="text-xs text-gray-600 dark:text-gray-300">
                            Katılımcıları onaylayarak alın
                          </p>
                        </div>
                        <Switch
                          checked={meetingSettings.enableLobby}
                          onCheckedChange={(checked) => 
                            setMeetingSettings(prev => ({ ...prev, enableLobby: checked }))
                          }
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          {meetingSettings.requirePassword ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          Şifre Koruması
                        </Label>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          Toplantıya katılım için şifre gerekli
                        </p>
                      </div>
                      <Switch
                        checked={meetingSettings.requirePassword}
                        onCheckedChange={(checked) => 
                          setMeetingSettings(prev => ({ ...prev, requirePassword: checked }))
                        }
                      />
                    </div>

                    {meetingSettings.requirePassword && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                      >
                        <Label htmlFor="password" className="text-sm font-medium">
                          Toplantı Şifresi
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Güvenli bir şifre girin"
                          value={meetingSettings.password}
                          onChange={(e) => setMeetingSettings(prev => ({ ...prev, password: e.target.value }))}
                          className="h-12"
                        />
                      </motion.div>
                    )}
                  </div>

                  <Separator />

                  {/* Additional Settings */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ek Ayarlar</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="maxParticipants" className="text-sm font-medium">
                          Maksimum Katılımcı Sayısı
                        </Label>
                        <Input
                          id="maxParticipants"
                          type="number"
                          min="2"
                          max="100"
                          value={meetingSettings.maxParticipants}
                          onChange={(e) => setMeetingSettings(prev => ({ 
                            ...prev, 
                            maxParticipants: parseInt(e.target.value) || 50 
                          }))}
                          className="h-12"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Kayıt Etme
                          </Label>
                          <p className="text-xs text-gray-600 dark:text-gray-300">
                            Toplantıyı otomatik kaydet
                          </p>
                        </div>
                        <Switch
                          checked={meetingSettings.enableRecording}
                          onCheckedChange={(checked) => 
                            setMeetingSettings(prev => ({ ...prev, enableRecording: checked }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6">
                    <Button 
                      onClick={handleCreateMeeting}
                      className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
                      disabled={isCreating || !meetingSettings.title.trim()}
                    >
                      {isCreating ? 'Toplantı Oluşturuluyor...' : 'Toplantı Oluştur'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur dark:bg-gray-800/80">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl text-green-600 dark:text-green-400">
                    🎉 Toplantı Başarıyla Oluşturuldu!
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">
                    Toplantı bilgilerinizi paylaşın ve katılımcıları davet edin
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-8">
                  <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Toplantı ID:</span>
                      <span className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400">
                        {generatedMeetingId}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyMeetingId}
                        className="ml-2"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Toplantı Bilgileri</h3>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Başlık:</span>
                        <span className="text-sm font-medium">{meetingSettings.title}</span>
                      </div>
                      {meetingSettings.description && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-300">Açıklama:</span>
                          <span className="text-sm font-medium">{meetingSettings.description}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Maksimum Katılımcı:</span>
                        <span className="text-sm font-medium">{meetingSettings.maxParticipants}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Güvenlik:</span>
                        <span className="text-sm font-medium">
                          {meetingSettings.requirePassword ? 'Şifreli' : 'Açık'} • {meetingSettings.enableLobby ? 'Lobili' : 'Direkt'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button 
                      onClick={handleJoinMeeting}
                      className="flex-1 h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
                    >
                      <Video className="mr-2 w-5 h-5" />
                      Toplantıya Katıl
                    </Button>

                    <Button 
                      onClick={copyMeetingLink}
                      variant="outline"
                      className="flex-1 h-12 text-lg font-semibold"
                    >
                      <Share2 className="mr-2 w-5 h-5" />
                      Bağlantıyı Paylaş
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}