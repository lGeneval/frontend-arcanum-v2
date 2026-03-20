import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.redirect(new URL('/login?error=no_code', request.url))
    }

    // Обмениваем код на сессию через Supabase
    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

    if (sessionError || !sessionData) {
      return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
    }

    const user = sessionData.user
    const email = user.email!
    const googleId = user.user_metadata.provider_id

    // Ищем или создаём профиль пользователя
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('google_id', googleId)
      .single()

    let userProfile = profile;

    if (profileError) {
      // Создаём новый профиль
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({
          email,
          google_id: googleId,
          balance: 0,
        })
        .select()
        .single()
      
      userProfile = newProfile;
    }

    // Сохраняем данные пользователя в localStorage
    const response = NextResponse.redirect(new URL('/dashboard', request.url))
    
    response.cookies.set('arcanum_user', JSON.stringify({
      id: userProfile.id,
      email: userProfile.email,
      google_id: userProfile.google_id,
      first_name: userProfile.telegram_first_name || user.email.split('@')[0],
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30 // 30 дней
    })

    return response
  } catch (error) {
    console.error('Ошибка при авторизации через Google:', error)
    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
  }
}