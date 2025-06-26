'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Video, Users, Calendar, ArrowRight, Moon, Sun, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

export default function HomePage() {
  const [userName, setUserName] = useState('');
  const [meetingId, setMeetingId] = useState('');
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const handleJoinMeeting = () => {
    if (!userName.trim()) {
      toast.error('Lütfen kullanıcı adınızı girin');
      return;
    }
    if (!meetingId.trim()) {
      toast.error('Lütfen toplantı ID\'sini girin');
      return;
    }
    
    localStorage.setItem('userName', userName);
    router.push(`/meeting/${meetingId}`);
  };

  const handleCreateMeeting = () => {
    if (!userName.trim()) {
      toast.error('Lütfen kullanıcı adınızı girin');
      return;
    }
    
    localStorage.setItem('userName', userName);
    router.push('/create-meeting');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      <Toaster />
      
      {/* Header */}
      <header className="flex justify-between items-center p-6">
        <motion.div 
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Video className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Primeet</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">Profesyonel Video Konferans</p>
          </div>
        </motion.div>

        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Kurumsal Video Konferans
              <span className="text-blue-600 block">Çözümünüz</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Güvenli, modern ve kullanıcı dostu video konferans deneyimi ile ekibinizi bir araya getirin.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Features */}
            <motion.div 
              className="space-y-8"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <div className="grid grid-cols-2 gap-6">
                <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Çoklu Katılımcı</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Onlarca katılımcı ile eş zamanlı toplantı</p>
                  </CardContent>
                </Card>

                <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <Video className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">HD Video</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Kristal netliğinde video kalitesi</p>
                  </CardContent>
                </Card>

                <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <Calendar className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Kolay Planlama</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Anında toplantı oluşturma</p>
                  </CardContent>
                </Card>

                <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <Plus className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Ek Özellikler</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Chat, dosya paylaşım, beyaz tahta</p>
                  </CardContent>
                </Card>
              </div>
            </motion.div>

            {/* Right Column - Meeting Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              <Card className="p-8 shadow-2xl border-0 bg-white/80 backdrop-blur dark:bg-gray-800/80">
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl text-gray-900 dark:text-white">Toplantıya Başlayın</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">
                    Kullanıcı adınızı girin ve toplantıya katılın veya yeni bir toplantı oluşturun
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Kullanıcı Adı *
                    </label>
                    <Input
                      placeholder="Adınızı girin"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="h-12 text-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Toplantı ID
                    </label>
                    <Input
                      placeholder="Örn: SECURE123"
                      value={meetingId}
                      onChange={(e) => setMeetingId(e.target.value.toUpperCase())}
                      className="h-12 text-lg"
                    />
                  </div>

                  <div className="space-y-4 pt-4">
                    <Button 
                      onClick={handleJoinMeeting}
                      className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
                      disabled={!userName.trim()}
                    >
                      Toplantıya Katıl
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-300 dark:border-gray-600" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">veya</span>
                      </div>
                    </div>

                    <Button 
                      onClick={handleCreateMeeting}
                      variant="outline"
                      className="w-full h-12 text-lg font-semibold border-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                      disabled={!userName.trim()}
                    >
                      <Plus className="mr-2 w-5 h-5" />
                      Yeni Toplantı Oluştur
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}