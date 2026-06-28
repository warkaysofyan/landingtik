const express = require('express')
const path = require('path')
const fs = require('fs') // مكتبة قراءة الملفات من السيرفر
const app = express()
const PORT = process.env.PORT || 3000

// عداد مشترك على السيرفر لمعرفة الدور على من
let currentAgentIndex = 0

// دالة ذكية لقراءة الإعدادات والأرقام مباشرة من ملف config.json
function getConfig() {
	try {
		const configPath = path.join(__dirname, 'config.json')
		const rawData = fs.readFileSync(configPath, 'utf8')
		return JSON.parse(rawData)
	} catch (error) {
		console.error(
			'خطأ في قراءة ملف config.json، سيتم استخدام إعدادات افتراضية:',
			error,
		)
		// إعدادات احتياطية في حال مسح الملف بالخطأ
		return {
			redirectDelay: 0,
			defaultBackupNumber: '212620342327',
			agents: [{ number: '212620342327', name: 'الدعم الافتراضي' }],
		}
	}
}

app.use(express.static(path.join(__dirname, 'public')))
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

// 1. الصفحة الرئيسية: تقرأ المؤقت ديناميكياً من ملف الإعدادات
app.get('/', (req, res) => {
	const config = getConfig()
	res.render('index', { delayInSeconds: config.redirectDelay })
})

// 2. نقطة النهاية (API): تقرأ الأرقام وتوزعها بالدور ديناميكياً
app.get('/get-agent', (req, res) => {
	const config = getConfig()
	const agentsList = config.agents

	// التحقق من وجود موظفين في القائمة
	if (!agentsList || agentsList.length === 0) {
		return res.json({ number: config.defaultBackupNumber, name: 'الاحتياطي' })
	}

	// التأكد من أن العداد لا يتخطى حجم القائمة الحالية (في حال قمت بحذف موظفين)
	if (currentAgentIndex >= agentsList.length) {
		currentAgentIndex = 0
	}

	const selectedAgent = agentsList[currentAgentIndex]

	// الانتقال للموظف التالي
	currentAgentIndex = (currentAgentIndex + 1) % agentsList.length

	res.json(selectedAgent)
})

app.listen(PORT, () => {
	console.log('http://localhost:' + PORT)
})
