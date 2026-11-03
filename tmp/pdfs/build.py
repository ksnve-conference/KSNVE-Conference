import json,re,html,math
from pathlib import Path
from io import BytesIO
from PIL import Image as PIL
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,Image,Table,TableStyle,PageBreak,KeepTogether
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.pagesizes import A4

ROOT=Path('/Users/seonghyeonkim/WorkingSpace/KSNVE/ksnve-conference')
SRC=ROOT.parent/'email-survey-proposal/images'
OUT=ROOT/'output/pdf/추계학술대회_앱_기능추가_안내.pdf'
OUT.parent.mkdir(parents=True,exist_ok=True)
data=json.loads((ROOT/'tmp/pdfs/page.json').read_text())
B=[b['markdown'] for b in data['content']['blocks']]
pdfmetrics.registerFont(TTFont('Korean','/System/Library/Fonts/Supplemental/Arial Unicode.ttf'))
pdfmetrics.registerFontFamily('Korean',normal='Korean',bold='Korean')
styles={
 'body':ParagraphStyle('body',fontName='Korean',fontSize=10,leading=16,spaceAfter=8,wordWrap='CJK',textColor=colors.HexColor('#253348')),
 'h1':ParagraphStyle('h1',fontName='Korean',fontSize=19,leading=27,spaceAfter=16,textColor=colors.HexColor('#075781')),
 'h2':ParagraphStyle('h2',fontName='Korean',fontSize=14,leading=21,spaceAfter=12,textColor=colors.HexColor('#075781')),
 'cap':ParagraphStyle('cap',fontName='Korean',fontSize=9,leading=14,spaceAfter=8,textColor=colors.HexColor('#58687c')),
}
def p(s,style='body'):
 s=re.sub(r'^#+ ','',s).replace('—','-').replace('–','-')
 s=html.escape(s);s=re.sub(r'\*\*(.*?)\*\*',r'<b>\1</b>',s)
 return Paragraph(s,styles[style])
def find(prefix):return next(s for s in B if s.startswith(prefix))
def img(name,w=480,h=580):
 im=PIL.open(SRC/name); iw,ih=im.size;scale=min(w/iw,h/ih)
 return Image(str(SRC/name),width=iw*scale,height=ih*scale)
def pair(names,caps,w=228,h=440):
 t=Table([[p(c,'cap') for c in caps],[img(n,w,h) for n in names]],colWidths=[243,243])
 t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),4),('RIGHTPADDING',(0,0),(-1,-1),4)]));return t
story=[p(data['content']['title'],'h1'),p(find('# 1'),'h2'),p(find('1. **발표')),p(find('2. **총일정표')),p(find('이제 프로그램북')),pair(['app8_presentation_guide.png','app9_program_schedule.png'],['발표 참가요령 - 좌장·구두발표·포스터·시상','전체 프로그램 옆 총일정표 버튼'],h=448),PageBreak(),p('총일정표 보기 및 PDF 다운로드','h1'),img('app10_schedule_pdf.png',w=480,h=660),PageBreak(),p(find('# 2'),'h1'),p('1. 건의 · 피드백   2. 참가 만족도 설문'),p('건의 · 피드백','h2')]
start=B.index(find('행사 기간에'));end=B.index(find('**더보기 메뉴**'))
story += [p(x) for x in B[start:end]]
story += [pair(['app2_more_menu.png','app3_feedback.png'],['더보기 메뉴','건의 · 피드백 작성 화면'],h=390),PageBreak(),p('참가 만족도 설문','h1'),p(find('참가자들의 다양한'))]
rows=[line.strip('|').split('|') for line in find('| 구분').splitlines() if not line.startswith('| ---')]
t=Table([[p(c.strip()) for c in row] for row in rows],colWidths=[75,411]);t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e8f1f7')),('BACKGROUND',(0,1),(0,-1),colors.HexColor('#f3f6f9')),('VALIGN',(0,0),(-1,-1),'TOP'),('LINEBELOW',(0,0),(-1,-1),0.4,colors.HexColor('#dce3ea')),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),5)]))
story += [t,Spacer(1,14),p(find('숙소, 식사')),p('설문 참여 배너 화면','cap'),img('app1_home_banner.png',w=280,h=310)]
# Divide the long survey screenshots at whitespace so all questions remain readable.
for name,label in [('survey_half_1.png','설문 전체 문항 1-11번'),('survey_half_2.png','설문 전체 문항 12-18번')]:
 im=PIL.open(SRC/name).convert('RGB'); iw,ih=im.size
 cuts=[0]
 for i in [1,2]:
  target=round(ih*i/3); candidates=range(target-90,target+91)
  def score(y):
   row=im.crop((35,y,iw-35,y+1));return sum(1 for r,g,b in row.getdata() if max(r,g,b)-min(r,g,b)<15 and r>238)
  cuts.append(max(candidates,key=score))
 cuts.append(ih)
 for i,(a,b) in enumerate(zip(cuts,cuts[1:])):
  crop=im.crop((0,a,iw,b));buf=BytesIO();crop.save(buf,format='PNG');buf.seek(0)
  scale=min(285/iw,645/(b-a))
  story += [PageBreak(),p(f'{label} ({i+1}/3)','h1'),Image(buf,width=iw*scale,height=(b-a)*scale)]
charts=['chart1_summary.png','chart2_items.png','chart3_priority.png','chart4_role_heatmap.png','chart5_usage.png','chart6_fields.png','chart7_again.png']
terms=['요약 지표','항목별 만족도','개선 우선순위','참가 유형별 비교','이용·참여율과 만족도','세션 분야 반응','재참가 의향']
for i,(name,term) in enumerate(zip(charts,terms)):
 story += [PageBreak(),p(find('# 3') if i==0 else '설문 결과 분석과 활용','h1')]
 if i==0:story.append(p(find('기존 분석 예시')))
 story += [p(find(f'{i+1}. **{term}**')),p(f'{term} - 가상 응답 100명 예시','cap'),img(name,w=486,h=530)]
 if i==6:story += [Spacer(1,14),p(find('결과는 내부적으로'))]
story += [PageBreak(),p(find('# 4'),'h1')]
story += [p(x) for x in B[B.index(find('# 4'))+1:]]
def page(c,doc):
 c.setFont('Korean',8);c.setFillColor(colors.HexColor('#7a8796'));c.drawString(54,28,'2026 추계학술대회 앱 기능 추가 안내');c.drawRightString(A4[0]-54,28,str(doc.page))
doc=SimpleDocTemplate(str(OUT),pagesize=A4,rightMargin=54,leftMargin=54,topMargin=43,bottomMargin=44,title=data['content']['title'],author='김성현')
doc.build(story,onFirstPage=page,onLaterPages=page)
print(OUT)
