import re
v1 = open('../litvm-tesseract/index.html', encoding='utf8').read()
nav = v1[v1.index('<div class="nav-wrap">'):v1.index('<canvas id="tx-gl"')].rstrip()
foot = v1[v1.index('<footer class="section_foot'):v1.index('</footer>') + 9]
ts = v1.index('<div class="tx-team-head rv">')
team = v1[ts:v1.index('</section>', ts)]
dims = v1[v1.index('<div class="tx-dim-panel on" id="tx-dim-intro">'):v1.index('<div class="tx-dim-ticks"')]
dims = dims[:dims.rindex('</div>')].rstrip()
dims = re.sub(r'<h2>(.*?)</h2>', r'<h2 data-rise>\1</h2>', dims)
head = v1[v1.index('<head>'):v1.index('</head>')]
body = open('work/body.html', encoding='utf8').read()
page = ('<!DOCTYPE html>\n<html data-wf-page="6833efad3334fbf8a866af55" data-wf-site="6833efad3334fbf8a866af59" lang="en">\n'
        + head + '</head>\n<body class="tx">\n' + nav + '\n\n<canvas id="tx-gl" aria-hidden="true"></canvas>\n\n'
        + body + '\n\n' + foot
        + '\n\n<script src="js/jquery.min.js"></script>\n<script src="js/gsap.min.js"></script>\n<script src="js/webflow.js"></script>\n<script src="js/litvm-nav.js"></script>\n<script src="js/app.js"></script>\n</body>\n</html>\n')
open('public/index.html', 'w', encoding='utf8', newline='\n').write(page)
print(len(page))
