import { Actor } from 'apify';
import axios from 'axios';

await Actor.main(async () => {
    const input = await Actor.getInput();
    if (!input?.resumeText) throw new Error('Resume text is required');
    if (!input?.openrouterApiKey) throw new Error('API key is required');

    const { resumeText, extractSkills = true, extractCertifications = true, model = 'openai/gpt-4o', openrouterApiKey } = input;

    const prompt = `Parse this resume and extract structured data:

${resumeText}

Return JSON:
{
  "personalInfo": {"name": "", "email": "", "phone": "", "location": ""},
  "summary": "string",
  "experience": [{"title": "", "company": "", "duration": "", "responsibilities": []}],
  "education": [{"degree": "", "school": "", "year": ""}],
  ${extractSkills ? '"skills": [],' : ''}
  ${extractCertifications ? '"certifications": [],' : ''}
  "languages": []
}`;

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model,
        messages: [{ role: 'system', content: 'You are an HR tech expert parsing resumes.' }, { role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
    }, {
        headers: { 'Authorization': `Bearer ${openrouterApiKey}`, 'HTTP-Referer': 'https://apify.com' }
    });

    const result = JSON.parse(response.data.choices[0].message.content);
    await Actor.pushData({ ...result, cost: 0.01, chargePrice: 0.50, parsedAt: new Date().toISOString() });
    console.log('✓ Resume parsed successfully!');
});
