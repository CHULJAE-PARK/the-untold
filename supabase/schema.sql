-- The Untold - Database Schema

-- 추모 공간
CREATE TABLE IF NOT EXISTS memorial_spaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL slug (예: /memorial/hong-gildong)
  name TEXT NOT NULL,        -- 고인 이름
  birth_year INT,
  death_year INT,
  bio TEXT,                  -- 짧은 소개
  cover_image_url TEXT,
  profile_image_url TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 추모 공간 멤버 (초대된 사람들)
CREATE TABLE IF NOT EXISTS memorial_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID REFERENCES memorial_spaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT, -- 미가입자 초대용
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  invited_at TIMESTAMPTZ DEFAULT now(),
  joined_at TIMESTAMPTZ,
  UNIQUE(space_id, user_id)
);

-- 추억 포스트 (사진/글/영상)
CREATE TABLE IF NOT EXISTS memorial_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID REFERENCES memorial_spaces(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT, -- 비회원 기고자용
  content TEXT,
  media_urls TEXT[], -- 사진/영상 URL 배열
  post_type TEXT DEFAULT 'story' CHECK (post_type IN ('story', 'photo', 'video', 'condolence')),
  happened_at DATE, -- 추억의 날짜
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 디지털 유서
CREATE TABLE IF NOT EXISTS digital_wills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  recipients JSONB DEFAULT '[]', -- [{name, email, relationship}]
  is_verified BOOLEAN DEFAULT false, -- 사망 확인 여부
  deliver_after_days INT DEFAULT 30, -- 사망 확인 후 N일 뒤 전송
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 추모 방명록 (공개 메시지)
CREATE TABLE IF NOT EXISTS memorial_condolences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID REFERENCES memorial_spaces(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT,
  message TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 정책
ALTER TABLE memorial_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE memorial_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE memorial_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE memorial_condolences ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_wills ENABLE ROW LEVEL SECURITY;

-- 공개 추모 공간은 누구나 조회 가능
CREATE POLICY "public spaces are viewable by everyone"
  ON memorial_spaces FOR SELECT
  USING (is_public = true);

-- 내가 만든 공간은 내가 수정/삭제
CREATE POLICY "owners can manage their spaces"
  ON memorial_spaces FOR ALL
  USING (auth.uid() = created_by);

-- 포스트: 공개 공간의 포스트는 누구나 조회
CREATE POLICY "posts in public spaces are viewable"
  ON memorial_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM memorial_spaces
      WHERE id = memorial_posts.space_id AND is_public = true
    )
  );

-- 포스트: 로그인 사용자는 작성 가능
CREATE POLICY "authenticated users can post"
  ON memorial_posts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 방명록: 공개 공간은 누구나 조회
CREATE POLICY "condolences in public spaces are viewable"
  ON memorial_condolences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM memorial_spaces
      WHERE id = memorial_condolences.space_id AND is_public = true
    )
  );

-- 방명록: 로그인 사용자는 작성 가능
CREATE POLICY "authenticated users can leave condolences"
  ON memorial_condolences FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 디지털 유서: 본인만 접근
CREATE POLICY "users can manage their own wills"
  ON digital_wills FOR ALL
  USING (auth.uid() = user_id);
