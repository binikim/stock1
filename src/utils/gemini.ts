import type { ChatMessage } from '../types';

/**
 * Gemini API를 호출하여 AI 투자 상담 답변을 받아옵니다.
 * 대화 이력을 포함하며, 시스템 컨텍스트로 현재 포트폴리오 상태를 주입합니다.
 * 
 * @param chatHistory 전체 대화 이력 배열
 * @param portfolioJsonString 포트폴리오 요약 JSON 문자열
 * @param apiKey 사용자가 설정에서 입력한 Gemini API Key
 */
export async function sendGeminiChatMessage(
  chatHistory: ChatMessage[],
  portfolioJsonString: string,
  apiKey: string
): Promise<string> {
  if (!apiKey) {
    throw new Error('Gemini API Key가 필요합니다. 설정 화면에서 입력해 주세요.');
  }

  // 1. 모델 및 엔드포인트 URL 구성 (gemini-3-flash-preview 고정)
  const modelName = 'gemini-3-flash-preview';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  // 2. 시스템 프롬프트(systemInstruction) 정의
  const systemInstructionText = `당신은 스마트하고 친절하며 신뢰할 수 있는 주식 투자 상담 AI 비서입니다.
사용자의 자산 관리, 포트폴리오 분산, 리스크 관리, 수익률 제고 등에 대해 전문적이고 정중하게 조언합니다.

다음은 사용자의 실시간 주식 포트폴리오 요약 정보(JSON)입니다:
${portfolioJsonString}

[중요 지침]
1. 사용자가 자신의 보유 자산에 대해 물으면 위 데이터를 기반으로 명확하고 이해하기 쉽게 분석하여 답변하세요.
2. 특정 종목의 매매 권유나 가격 예측은 지양하고, 포트폴리오의 다각화(Diversification), 섹터 비중, 현금 비중의 필요성 등 건전한 투자 원칙을 제시하세요.
3. 포트폴리오에 등록되지 않은 종목이나 일반적인 주식/시장 분석 질문에 대해서도 친절하고 전문적으로 답변해 주세요.
4. 모든 투자 결정 및 결과에 대한 최종 책임은 사용자 본인에게 있음을 답변의 끝이나 맥락에 맞추어 부드럽게 고지해 주세요.
5. 답변은 마크다운 형식을 적극 활용하여 가독성 있게 한국어로 제공해 주세요.`;

  // 3. API 요청 바디 구성 (Gemini API 스펙 준수)
  const requestBody = {
    contents: chatHistory.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    })),
    systemInstruction: {
      parts: [
        {
          text: systemInstructionText,
        },
      ],
    },
    // 대화의 안정성을 높이기 위한 일부 파라미터 조정
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error?.message || `HTTP ${response.status}`;
      throw new Error(`Gemini API 호출 실패: ${errorMessage}`);
    }

    const responseData = await response.json();
    
    // 응답 텍스트 추출
    const replyText =
      responseData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!replyText) {
      throw new Error('Gemini API로부터 올바른 응답 텍스트를 받지 못했습니다.');
    }

    return replyText;
  } catch (error: any) {
    console.error('Gemini Chat Error:', error);
    throw error;
  }
}
